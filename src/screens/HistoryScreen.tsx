import { useNavigate } from 'react-router-dom';
import { loadGames, deleteGame, getStats, saveGame } from '@/services/gameStorageService';
import { assessReliability } from '@/services/psychProfileService';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PgnImportModal } from '@/components/analysis/PgnImportModal';
import type { SavedGame } from '@/types/chess';

function StatsBanner({ games }: { games: SavedGame[] }) {
  const stats = getStats();
  if (stats.total === 0) return null;

  const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
  const trendIcon = stats.accuracyTrend === null ? null
    : stats.accuracyTrend > 2 ? '↑' : stats.accuracyTrend < -2 ? '↓' : '→';
  const trendColor = stats.accuracyTrend === null ? ''
    : stats.accuracyTrend > 2 ? 'text-chess-win' : stats.accuracyTrend < -2 ? 'text-chess-loss' : 'text-chess-text-muted';

  const analyzedCount = games.filter((g) => g.analyzed).length;

  return (
    <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-chess-surface rounded-2xl border border-chess-border/40">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-lg font-black text-chess-text-primary">{stats.total}</span>
        <span className="text-[10px] text-chess-text-muted">Parties</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-lg font-black text-chess-win">{winRate}%</span>
        <span className="text-[10px] text-chess-text-muted">Victoires</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        {stats.avgAccuracy !== null ? (
          <span className="text-lg font-black text-chess-accent-light flex items-center gap-0.5">
            {stats.avgAccuracy}%
            {trendIcon && <span className={`text-sm ${trendColor}`}>{trendIcon}</span>}
          </span>
        ) : (
          <span className="text-lg font-black text-chess-text-muted">—</span>
        )}
        <span className="text-[10px] text-chess-text-muted">Précision</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-lg font-black text-chess-text-primary">{analyzedCount}</span>
        <span className="text-[10px] text-chess-text-muted">Analysées</span>
      </div>
    </div>
  );
}

export default function HistoryScreen() {
  const navigate = useNavigate();
  const [games, setGames] = useState<SavedGame[]>(() => loadGames());
  const [showImport, setShowImport] = useState(false);

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteGame(id);
    setGames(loadGames());
  }

  function toggleProfile(game: SavedGame, e: React.MouseEvent) {
    e.stopPropagation();
    saveGame({ ...game, excludeFromProfile: !game.excludeFromProfile });
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
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => navigate('/profile')}>
            🧠 Profil
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowImport(true)}>
            Importer
          </Button>
        </div>
      </div>

      <StatsBanner games={games} />

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

          const playerAcc = g.accuracy
            ? (g.playerColor === 'w' ? g.accuracy.white : g.accuracy.black)
            : null;
          const blunders = g.analyzed
            ? g.moves.filter((m) => m.classification === 'blunder').length
            : null;
          const mistakes = g.analyzed
            ? g.moves.filter((m) => m.classification === 'mistake').length
            : null;

          const accColor = playerAcc === null ? '' : playerAcc >= 80 ? 'text-chess-win' : playerAcc >= 60 ? 'text-chess-draw' : 'text-chess-loss';

          const reliability = assessReliability(g);
          const excluded = g.excludeFromProfile === true;

          return (
            <div
              key={g.id}
              onClick={() => navigate(`/analysis?gameId=${g.id}`)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-chess-border/60 bg-surface-gradient p-3 shadow-card transition-all hover:border-chess-accent/40 active:scale-[0.99]"
            >
              {/* Result pill */}
              <div className={`shrink-0 ${resultBg} rounded-xl px-2.5 py-1.5 text-center min-w-[64px]`}>
                <div className={`text-sm font-bold ${resultColor}`}>{resultLabel}</div>
                {playerAcc !== null && (
                  <div className={`text-xs font-semibold ${accColor}`}>{playerAcc}%</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-chess-text-primary">
                    {g.playerColor === 'w' ? '♔' : '♚'} vs {g.botElo > 0 ? `Bot ${g.botElo}` : 'Humain'}
                  </span>
                  {g.analyzed && (
                    <span className="text-xs bg-chess-accent/20 text-chess-accent px-1.5 py-0.5 rounded">
                      Analysé
                    </span>
                  )}
                  {blunders !== null && blunders > 0 && (
                    <span className="text-xs bg-chess-blunder/10 text-chess-blunder px-1.5 py-0.5 rounded">
                      {blunders}??
                    </span>
                  )}
                  {mistakes !== null && mistakes > 0 && (
                    <span className="text-xs bg-chess-mistake/10 text-chess-mistake px-1.5 py-0.5 rounded">
                      {mistakes}?
                    </span>
                  )}
                  {excluded ? (
                    <span className="text-xs bg-chess-surface-alt text-chess-text-muted px-1.5 py-0.5 rounded">
                      Hors profil
                    </span>
                  ) : !reliability.reliable && (
                    <span
                      className="text-xs bg-chess-draw/10 text-chess-draw px-1.5 py-0.5 rounded"
                      title={reliability.reasons.join(' · ')}
                    >
                      Atypique
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

              {/* Profile inclusion toggle */}
              <button
                onClick={(e) => toggleProfile(g, e)}
                className={`shrink-0 w-7 h-7 flex items-center justify-center transition-colors rounded ${
                  excluded ? 'text-chess-text-muted hover:text-chess-accent' : 'text-chess-accent hover:text-chess-text-muted'
                }`}
                title={excluded ? 'Inclure dans le profil' : 'Exclure du profil'}
              >
                {excluded ? '🚫' : '🧠'}
              </button>

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
