import { Chess } from 'chess.js';
import type { SavedGame, MoveRecord } from '@/types/chess';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function parsePgn(pgn: string): SavedGame | null {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn.trim());
    const history = chess.history({ verbose: true });
    if (history.length === 0) return null;

    const tempChess = new Chess();
    const moves: MoveRecord[] = history.map((m, i) => {
      tempChess.move(m);
      return {
        san: m.san,
        uci: m.from + m.to + (m.promotion ?? ''),
        fen: tempChess.fen(),
        evalCp: null,
        evalMate: null,
        classification: null,
        bestMoveSan: null,
        bestMoveUci: null,
        timeTakenMs: 0,
        moveNumber: Math.ceil((i + 1) / 2),
        color: m.color,
      };
    });

    const resultTag = pgn.match(/\[Result\s+"([^"]+)"\]/);
    let result: SavedGame['result'] = null;
    if (resultTag) {
      const r = resultTag[1];
      if (r === '1-0') result = 'white';
      else if (r === '0-1') result = 'black';
      else if (r === '1/2-1/2') result = 'draw';
    }

    return {
      id: generateId(),
      pgn,
      moves,
      result,
      endReason: null,
      playerColor: 'w',
      botElo: 0,
      timeControl: { minutes: 10, increment: 0, label: '10+0' },
      startedAt: Date.now(),
      endedAt: Date.now(),
      analyzed: false,
    };
  } catch {
    return null;
  }
}

// Split a multi-game PGN string into individual PGNs.
function splitMultiPgn(text: string): string[] {
  const games: string[] = [];
  const lines = text.split('\n');
  let current: string[] = [];
  let inMoves = false;

  for (const line of lines) {
    if (line.startsWith('[Event ') && current.length > 0 && inMoves) {
      games.push(current.join('\n').trim());
      current = [];
      inMoves = false;
    }
    if (line.trim() && !line.startsWith('[')) inMoves = true;
    current.push(line);
  }
  if (current.length > 0) games.push(current.join('\n').trim());
  return games.filter((g) => g.length > 0);
}

export async function fetchLichessGames(username: string): Promise<SavedGame[]> {
  if (!navigator.onLine) throw new Error('Pas de connexion réseau. Vérifiez votre connexion et réessayez.');
  const res = await fetch(
    `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=5&moves=true&pgnInJson=true`,
    { headers: { Accept: 'application/x-ndjson' } }
  );
  if (!res.ok) throw new Error(`Joueur "${username}" introuvable sur Lichess`);

  const text = await res.text();
  const games: SavedGame[] = [];

  for (const line of text.trim().split('\n')) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line) as { pgn?: string };
      if (obj.pgn) {
        const saved = parsePgn(obj.pgn);
        if (saved) games.push(saved);
      }
    } catch {}
  }

  if (games.length === 0) throw new Error('Aucune partie trouvée pour cet utilisateur');
  return games;
}

export async function fetchChessComGames(username: string): Promise<SavedGame[]> {
  if (!navigator.onLine) throw new Error('Pas de connexion réseau. Vérifiez votre connexion et réessayez.');
  // Get monthly archive list
  const archRes = await fetch(
    `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`
  );
  if (!archRes.ok) throw new Error(`Joueur "${username}" introuvable sur Chess.com`);
  const { archives } = (await archRes.json()) as { archives?: string[] };
  if (!archives?.length) throw new Error('Aucune partie trouvée pour cet utilisateur');

  // Fetch the most recent archive
  const lastUrl = archives[archives.length - 1]!;
  const gamesRes = await fetch(lastUrl);
  if (!gamesRes.ok) throw new Error('Erreur lors du chargement des parties');
  const { games } = (await gamesRes.json()) as { games?: Array<{ pgn?: string }> };

  const result: SavedGame[] = [];
  for (const game of (games ?? []).slice(-5)) {
    if (!game.pgn) continue;
    const saved = parsePgn(game.pgn);
    if (saved) result.push(saved);
  }

  if (result.length === 0) throw new Error('Aucune partie valide trouvée');
  return result;
}
