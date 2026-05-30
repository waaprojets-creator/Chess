import { create } from 'zustand';
import type { SavedGame, MoveRecord, EvalPoint, Arrow } from '@/types/chess';
import { scoreToPercent } from '@/constants/classification';
import { getStockfishService } from '@/services/stockfishService';
import { analyzeGame } from '@/services/analysisService';
import { saveGame } from '@/services/gameStorageService';

interface AnalysisStore {
  game: SavedGame | null;
  currentMoveIndex: number;
  isAnalyzing: boolean;
  analysisProgress: number;
  isDeepAnalyzing: boolean;
  deepAnalysisProgress: number;
  moves: MoveRecord[];
  graphData: EvalPoint[];
  currentFen: string;
  currentArrows: Arrow[];

  loadGame: (game: SavedGame) => void;
  startAnalysis: () => Promise<void>;
  startDeepAnalysis: () => Promise<void>;
  cancelDeepAnalysis: () => void;
  goToMove: (index: number) => void;
  nextMove: () => void;
  prevMove: () => void;
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

let deepCancelSignal: { cancelled: boolean } | null = null;

function fenAtMove(moves: MoveRecord[], index: number): string {
  if (index < 0) return START_FEN;
  return moves[index]?.fen ?? START_FEN;
}

// Arrow shows the best move FROM the current position (after move `index`).
// bestMoveUci on moves[index+1] = engine's top choice from the position shown at index.
function arrowsAtMove(moves: MoveRecord[], index: number): Arrow[] {
  const m = moves[index + 1];
  if (!m?.bestMoveUci) return [];
  return [
    {
      from: m.bestMoveUci.slice(0, 2),
      to: m.bestMoveUci.slice(2, 4),
      color: 'rgba(0,180,0,0.7)',
    },
  ];
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  game: null,
  currentMoveIndex: -1,
  isAnalyzing: false,
  analysisProgress: 0,
  isDeepAnalyzing: false,
  deepAnalysisProgress: 0,
  moves: [],
  graphData: [],
  currentFen: START_FEN,
  currentArrows: [],

  loadGame(game) {
    const moves = game.moves;
    set({
      game,
      moves,
      graphData: moves.map((m, i) => ({
        moveIndex: i,
        san: m.san,
        evalPercent: scoreToPercent(m.evalCp, m.evalMate),
        evalCp: m.evalCp,
        evalMate: m.evalMate,
        color: m.color,
      })),
      currentMoveIndex: moves.length - 1,
      currentFen: fenAtMove(moves, moves.length - 1),
      currentArrows: arrowsAtMove(moves, moves.length - 1),
      isAnalyzing: false,
      analysisProgress: 0,
      isDeepAnalyzing: false,
      deepAnalysisProgress: 0,
    });
  },

  async startAnalysis() {
    const { game } = get();
    if (!game || get().isAnalyzing) return;

    set({ isAnalyzing: true, analysisProgress: 0 });
    try {
      const sf = getStockfishService();
      await sf.waitReady();

      const { moves, graphData, accuracy } = await analyzeGame(
        game,
        sf,
        (idx, total) => set({ analysisProgress: idx / total }),
        'fast'
      );

      const updatedGame: SavedGame = { ...game, moves, analyzed: true, accuracy };
      saveGame(updatedGame);

      set({
        game: updatedGame,
        moves,
        graphData,
        isAnalyzing: false,
        analysisProgress: 1,
        currentArrows: arrowsAtMove(moves, get().currentMoveIndex),
      });
    } catch (err) {
      console.error('[Analysis]', err);
      set({ isAnalyzing: false });
    }
  },

  async startDeepAnalysis() {
    const { game } = get();
    if (!game || get().isDeepAnalyzing) return;

    deepCancelSignal = { cancelled: false };
    set({ isDeepAnalyzing: true, deepAnalysisProgress: 0 });
    try {
      const sf = getStockfishService();
      await sf.waitReady();

      const { moves, graphData, accuracy } = await analyzeGame(
        game,
        sf,
        (idx, total) => set({ deepAnalysisProgress: idx / total }),
        'deep',
        deepCancelSignal
      );

      if (deepCancelSignal?.cancelled) {
        set({ isDeepAnalyzing: false });
        return;
      }

      const updatedGame: SavedGame = { ...game, moves, analyzed: true, deepAnalyzed: true, accuracy };
      saveGame(updatedGame);

      set({
        game: updatedGame,
        moves,
        graphData,
        isDeepAnalyzing: false,
        deepAnalysisProgress: 1,
        currentArrows: arrowsAtMove(moves, get().currentMoveIndex),
      });
    } catch (err) {
      console.error('[DeepAnalysis]', err);
      set({ isDeepAnalyzing: false });
    }
  },

  cancelDeepAnalysis() {
    if (deepCancelSignal) deepCancelSignal.cancelled = true;
    set({ isDeepAnalyzing: false });
  },

  goToMove(index) {
    const { moves } = get();
    const clamped = Math.max(-1, Math.min(moves.length - 1, index));
    set({
      currentMoveIndex: clamped,
      currentFen: fenAtMove(moves, clamped),
      currentArrows: arrowsAtMove(moves, clamped),
    });
  },

  nextMove() {
    get().goToMove(get().currentMoveIndex + 1);
  },

  prevMove() {
    get().goToMove(get().currentMoveIndex - 1);
  },
}));
