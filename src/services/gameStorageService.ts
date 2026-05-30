import type { SavedGame } from '@/types/chess';

const KEY = 'chess:games';

export function saveGame(game: SavedGame): void {
  const games = loadGames();
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) {
    games[idx] = game;
  } else {
    games.unshift(game);
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(games.slice(0, 100)));
  } catch {}
}

export function loadGames(): SavedGame[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedGame[];
  } catch {
    return [];
  }
}

export function getGameById(id: string): SavedGame | undefined {
  return loadGames().find((g) => g.id === id);
}

export function deleteGame(id: string): void {
  const games = loadGames().filter((g) => g.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(games));
  } catch {}
}

export interface GameStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  avgAccuracy: number | null;
  accuracyTrend: number | null; // positive = improving, negative = declining
}

export function getStats(): GameStats {
  const games = loadGames();
  let wins = 0, losses = 0, draws = 0;
  const accuracies: number[] = [];

  for (const g of games) {
    if (g.result !== null) {
      const playerWon = (g.result === 'white' && g.playerColor === 'w') || (g.result === 'black' && g.playerColor === 'b');
      const playerLost = (g.result === 'white' && g.playerColor === 'b') || (g.result === 'black' && g.playerColor === 'w');
      if (playerWon) wins++;
      else if (playerLost) losses++;
      else draws++;
    }
    if (g.accuracy) {
      const playerAcc = g.playerColor === 'w' ? g.accuracy.white : g.accuracy.black;
      accuracies.push(playerAcc);
    }
  }

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const avgAccuracy = avg(accuracies);

  let accuracyTrend: number | null = null;
  if (accuracies.length >= 4) {
    // Compare last 5 vs previous 5 (games are newest-first)
    const recent = accuracies.slice(0, Math.min(5, accuracies.length));
    const older = accuracies.slice(Math.min(5, accuracies.length), Math.min(10, accuracies.length));
    if (older.length > 0) {
      accuracyTrend = (avg(recent) ?? 0) - (avg(older) ?? 0);
    }
  }

  return { total: games.length, wins, losses, draws, avgAccuracy, accuracyTrend };
}
