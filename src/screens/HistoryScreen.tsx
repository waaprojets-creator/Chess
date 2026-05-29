import { useNavigate } from 'react-router-dom';
import { loadGames, deleteGame } from '@/services/gameStorageService';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PgnImportModal } from '@/components/analysis/PgnImportModal';
import type { SavedGame } from '@/types/chess';

export default function HistoryScreen() {
  const navigate = useNavigate();
  const [games, setGames] = useState<SavedGame[]>(() => loadGames());
  const [showImport, setShowImport] = useState(false);

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteGame(id);
    setGames(loadGames());
  }

  function handleImported(gameId?: string) {
    setShowImport(false);
    setGames(loadGames());
    if (gameId) navigate(`/analysis?gameId=${gameId}`);
  }

  if (games.length === 0) {
    return (
      <div className="screen-enter mx-auto max-w-lg px-4 pt-safe">
        <PgnImportModal open={showImport} onClose={() => setShowImport(false)} onImported={handleImported} />
        <h1 className="pt-6 text-2xl font-black tracking-tight text-chess-text-primary">Parties</h1>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-chess-border bg-chess-surface/40 px-6 py-14 text-center text-chess-text-muted">
          <span className="text-5xl">♟</span>
          <p className="text-sm font-medium">Aucune partie enregistrée</p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/play')}>Jouer une partie</Button>
            <Button variant="ghost" onClick={() => setShowImport(true)}>Importer</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-enter mx-auto max-w-lg px-4 pt-safe">
      <PgnImportModal open={showImport} onClose={() => setShowImport(false)} onImported={handleImported} />
      <div className="flex items-center justify-between pt-6 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-chess-text-primary">
          Parties <span className="text-base font-semibold text-chess-text-muted">({games.length})</span>
        </h1>
        <Button size="sm" variant="ghost" onClick={() => setShowImport(true)}>
          Importer
        </Button>
      </div>

      <div className="space-y-2.5">
        {games.map((g) => {
          const playerWon =
            (g.result === 'white' && g.playerColor === 'w') ||
            (g.result === 'black' && g.playerColor === 'b');
          const playerLost =
            (g.result === 'white' && g.playerColor === 'b') ||
            (g.result === 'black' && g.playerColor === 'w');
          const isDraw = g.result === 'draw';

          const resultLabel = playerWon ? 'Victoire' : playerLost ? 'Défaite' : isDraw ? 'Nulle' : '?';
          const resultColor = playerWon ? 'text-chess-win' : playerLost ? 'text-chess-loss' : 'text-chess-draw';
          const resultBg = playerWon ? 'bg-chess-win/10' : playerLost ? 'bg-chess-loss/10' : 'bg-chess-draw/10';

          const date = new Date(g.startedAt);
          const duration = g.endedAt ? Math.round((g.endedAt - g.startedAt) / 60_000) : 0;

          return (
            <div
              key={g.id}
              onClick={() => navigate(`/analysis?gameId=${g.id}`)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-chess-border/60 bg-surface-gradient p-3 shadow-card transition-all hover:border-chess-accent/40 active:scale-[0.99]"
            >
              {/* Result pill */}
              <div className={`shrink-0 ${resultBg} rounded-xl px-2.5 py-1.5 text-center min-w-[64px]`}>
                <div className={`text-sm font-bold ${resultColor}`}>{resultLabel}</div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-chess-text-primary">
                    {g.playerColor === 'w' ? '♔' : '♚'} vs Bot {g.botElo}
                  </span>
                  {g.analyzed && (
                    <span className="text-xs bg-chess-accent/20 text-chess-accent px-1.5 py-0.5 rounded">
                      Analysé
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-chess-text-muted mt-0.5">
                  <span>{g.timeControl.label}</span>
                  <span>·</span>
                  <span>{g.moves.length} coups</span>
                  {duration > 0 && <><span>·</span><span>{duration}m</span></>}
                  <span>·</span>
                  <span>{date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => handleDelete(g.id, e)}
                className="shrink-0 w-7 h-7 flex items-center justify-center text-chess-text-muted hover:text-chess-blunder transition-colors rounded"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
