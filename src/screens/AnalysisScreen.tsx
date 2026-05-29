import { useEffect, useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAnalysisStore } from '@/store/analysisStore';
import { getGameById } from '@/services/gameStorageService';
import { ChessBoard } from '@/components/board/ChessBoard';
import { EvalBar } from '@/components/board/EvalBar';
import { MoveList } from '@/components/game/MoveList';
import { AdvantageGraph } from '@/components/analysis/AdvantageGraph';
import { BestMoveSuggestion } from '@/components/analysis/BestMoveSuggestion';
import { MoveClassBadge } from '@/components/analysis/MoveClassBadge';
import { PgnImportModal } from '@/components/analysis/PgnImportModal';
import { Button } from '@/components/ui/Button';
import { CLASSIFICATION_META } from '@/constants/classification';

export default function AnalysisScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const gameId = params.get('gameId');
  const store = useAnalysisStore();
  const [boardWidth, setBoardWidth] = useState(360);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    function measure() {
      const vw = window.innerWidth;
      setBoardWidth(Math.min(vw - 32, 400));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!gameId) return;
    const game = getGameById(gameId);
    if (!game) { navigate('/history'); return; }
    store.loadGame(game);
  }, [gameId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') store.nextMove();
      if (e.key === 'ArrowLeft') store.prevMove();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);

  const currentMove = store.moves[store.currentMoveIndex];
  const currentEvalCp = currentMove?.evalCp ?? null;
  const currentEvalMate = currentMove?.evalMate ?? null;

  const summary = (() => {
    const counts: Record<string, number> = {};
    store.moves.forEach((m) => {
      if (m.classification) {
        counts[m.classification] = (counts[m.classification] ?? 0) + 1;
      }
    });
    return counts;
  })();

  // No game requested → friendly empty state instead of a blank scaffold.
  // (An invalid gameId is redirected to /history by the effect above.)
  if (!gameId) {
    return (
      <div className="screen-enter mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
        <div className="text-5xl">🔍</div>
        <h1 className="mt-4 text-lg font-bold text-chess-text-primary">Aucune partie à analyser</h1>
        <p className="mt-1.5 text-sm text-chess-text-muted">
          Choisissez une partie terminée pour la revoir coup par coup avec Stockfish.
        </p>
        <Button className="mt-6" onClick={() => navigate('/history')}>
          Voir mes parties
        </Button>
      </div>
    );
  }

  return (
    <div className="screen-enter mx-auto max-w-lg space-y-4 px-4 pt-safe">
      <PgnImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={(id) => {
          setShowImport(false);
          if (id) navigate(`/analysis?gameId=${id}`);
          else navigate('/history');
        }}
      />

      <div className="flex items-center justify-between pt-5">
        <h1 className="text-2xl font-black tracking-tight text-chess-text-primary">Analyse</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowImport(true)}>
            Importer
          </Button>
          {!store.game?.analyzed && !store.isAnalyzing && store.game && (
            <Button size="sm" onClick={() => store.startAnalysis()}>
              Analyser
            </Button>
          )}
          {store.isAnalyzing && (
            <div className="flex items-center gap-2 text-sm text-chess-text-secondary">
              <div className="w-4 h-4 border-2 border-chess-accent border-t-transparent rounded-full animate-spin" />
              {Math.round(store.analysisProgress * 100)}%
            </div>
          )}
        </div>
      </div>

      {/* Board + eval */}
      <div className="flex items-center gap-2">
        <EvalBar
          evalCp={currentEvalCp}
          evalMate={currentEvalMate}
          flipped={store.game?.playerColor === 'b'}
          className="self-stretch"
        />
        <ChessBoard
          fen={store.currentFen}
          boardFlipped={store.game?.playerColor === 'b'}
          arrows={store.currentArrows}
          interactive={false}
          width={boardWidth - 28}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => store.goToMove(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-chess-border/60 bg-surface-gradient text-chess-text-secondary transition-all hover:border-chess-accent/40 hover:text-chess-text-primary active:scale-95"
        >
          ⏮
        </button>
        <button
          onClick={store.prevMove}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-chess-border/60 bg-surface-gradient text-chess-text-secondary transition-all hover:border-chess-accent/40 hover:text-chess-text-primary active:scale-95"
        >
          ◀
        </button>
        <button
          onClick={store.nextMove}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-chess-border/60 bg-surface-gradient text-chess-text-secondary transition-all hover:border-chess-accent/40 hover:text-chess-text-primary active:scale-95"
        >
          ▶
        </button>
        <button
          onClick={() => store.goToMove(store.moves.length - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-chess-border/60 bg-surface-gradient text-chess-text-secondary transition-all hover:border-chess-accent/40 hover:text-chess-text-primary active:scale-95"
        >
          ⏭
        </button>
      </div>

      {/* Best move suggestion */}
      {currentMove && <BestMoveSuggestion move={currentMove} />}

      {/* Advantage graph */}
      {store.graphData.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-chess-text-muted font-medium">Graphe d'avantage</div>
          <AdvantageGraph
            data={store.graphData}
            currentIndex={store.currentMoveIndex}
            onMoveClick={store.goToMove}
          />
        </div>
      )}

      {/* Move list */}
      <div className="bg-chess-surface rounded-xl overflow-hidden" style={{ maxHeight: 200 }}>
        <MoveList
          moves={store.moves}
          currentIndex={store.currentMoveIndex}
          onMoveClick={store.goToMove}
        />
      </div>

      {/* Accuracy + Summary */}
      {store.game?.analyzed && Object.keys(summary).length > 0 && (
        <div className="bg-chess-surface rounded-xl p-4 space-y-3">
          {/* Accuracy per player */}
          {store.game.accuracy && (
            <div className="flex gap-4 pb-3 border-b border-chess-border/40">
              {[
                { label: 'Blancs', value: store.game.accuracy.white, color: '#e8e6e3' },
                { label: 'Noirs', value: store.game.accuracy.black, color: '#9ca3af' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="relative w-14 h-14">
                    <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                      <circle
                        cx="20" cy="20" r="16"
                        fill="none"
                        stroke={value >= 80 ? '#97b172' : value >= 60 ? '#f0c15c' : '#cc3232'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(value / 100) * 100.53} 100.53`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
                      {value}%
                    </span>
                  </div>
                  <span className="text-xs text-chess-text-muted">{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-sm font-semibold text-chess-text-secondary">Résumé</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary).map(([cls, count]) => {
              const meta = CLASSIFICATION_META[cls as keyof typeof CLASSIFICATION_META];
              if (!meta || !meta.symbol) return null;
              return (
                <div key={cls} className="flex items-center gap-1 text-sm">
                  <MoveClassBadge classification={cls as any} />
                  <span className="text-chess-text-secondary">{count}×</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
