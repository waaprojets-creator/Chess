import { useState } from 'react';
import { parsePgn, fetchLichessGames, fetchChessComGames } from '@/services/importService';
import { saveGame } from '@/services/gameStorageService';
import { Button } from '@/components/ui/Button';

interface PgnImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (gameId?: string) => void;
}

type Tab = 'pgn' | 'online';
type Platform = 'lichess' | 'chesscom';

export function PgnImportModal({ open, onClose, onImported }: PgnImportModalProps) {
  const [tab, setTab] = useState<Tab>('pgn');
  const [pgnText, setPgnText] = useState('');
  const [platform, setPlatform] = useState<Platform>('lichess');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleImportPgn() {
    setError(null);
    const saved = parsePgn(pgnText);
    if (!saved) {
      setError('PGN invalide — vérifiez la syntaxe');
      return;
    }
    saveGame(saved);
    onImported(saved.id);
  }

  async function handleImportOnline() {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const games =
        platform === 'lichess'
          ? await fetchLichessGames(username.trim())
          : await fetchChessComGames(username.trim());
      games.forEach(saveGame);
      onImported();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-chess-surface border border-chess-border/50 p-6 space-y-4 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-chess-text-muted hover:text-chess-text-primary text-lg leading-none"
          aria-label="Fermer"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-chess-text-primary">Importer une partie</h2>

        {/* Tab selector */}
        <div className="flex gap-1 p-1 bg-chess-bg rounded-xl">
          {(['pgn', 'online'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${tab === t
                  ? 'bg-chess-accent text-white'
                  : 'text-chess-text-muted hover:text-chess-text-primary'}`}
            >
              {t === 'pgn' ? 'Coller PGN' : 'En ligne'}
            </button>
          ))}
        </div>

        {tab === 'pgn' ? (
          <>
            <textarea
              value={pgnText}
              onChange={(e) => setPgnText(e.target.value)}
              placeholder={'[Event "..."]\n\n1. e4 e5 2. Nf3 ...'}
              className="w-full h-36 rounded-xl bg-chess-bg border border-chess-border/50 p-3 text-xs text-chess-text-primary font-mono resize-none focus:outline-none focus:border-chess-accent/60 placeholder:text-chess-text-muted/50"
            />
            <Button fullWidth onClick={handleImportPgn} disabled={!pgnText.trim()}>
              Importer et analyser
            </Button>
          </>
        ) : (
          <>
            <div className="flex gap-1 p-1 bg-chess-bg rounded-xl">
              {(['lichess', 'chesscom'] as Platform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${platform === p
                      ? 'bg-chess-surface-hover text-chess-text-primary'
                      : 'text-chess-text-muted hover:text-chess-text-primary'}`}
                >
                  {p === 'lichess' ? 'Lichess' : 'Chess.com'}
                </button>
              ))}
            </div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleImportOnline()}
              placeholder="Nom d'utilisateur"
              className="w-full rounded-xl bg-chess-bg border border-chess-border/50 px-3 py-2.5 text-sm text-chess-text-primary focus:outline-none focus:border-chess-accent/60 placeholder:text-chess-text-muted/60"
            />
            <Button
              fullWidth
              onClick={handleImportOnline}
              disabled={!username.trim() || loading}
            >
              {loading ? 'Chargement…' : 'Importer les 5 dernières parties'}
            </Button>
          </>
        )}

        {error && (
          <p className="text-xs text-chess-blunder bg-chess-blunder/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
