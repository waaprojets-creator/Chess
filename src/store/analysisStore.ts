import { create } from 'zustand';
import { Chess } from 'chess.js';
import type { SavedGame, MoveRecord, EvalPoint, Arrow, MoveNode } from '@/types/chess';
import { scoreToPercent } from '@/constants/classification';
import { getStockfishService } from '@/services/stockfishService';
import { analyzeGame } from '@/services/analysisService';
import { saveGame } from '@/services/gameStorageService';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

let deepCancelSignal: { cancelled: boolean } | null = null;

// ── Tree helpers ────────────────────────────────────────────────────────────

function buildTree(moves: MoveRecord[]): MoveNode[] {
  let children: MoveNode[] = [];
  for (let i = moves.length - 1; i >= 0; i--) {
    children = [{ record: moves[i]!, children }];
  }
  return children;
}

function nodeAtPath(roots: MoveNode[], path: number[]): MoveNode | null {
  if (path.length === 0) return null;
  let node: MoveNode | undefined = roots[path[0]];
  for (let i = 1; i < path.length; i++) {
    if (!node) return null;
    node = node.children[path[i]];
  }
  return node ?? null;
}

function parentOfPath(roots: MoveNode[], path: number[]): MoveNode | null {
  if (path.length <= 1) return null;
  return nodeAtPath(roots, path.slice(0, -1));
}

function fenAtPath(roots: MoveNode[], path: number[]): string {
  return nodeAtPath(roots, path)?.record.fen ?? START_FEN;
}

function arrowsAtPath(roots: MoveNode[], path: number[]): Arrow[] {
  // Arrow = best move FROM current position = found on next node in main line
  const nextNode = nodeAtPath(roots, [...path, 0]);
  if (!nextNode?.record.bestMoveUci) return [];
  return [{
    from: nextNode.record.bestMoveUci.slice(0, 2),
    to: nextNode.record.bestMoveUci.slice(2, 4),
    color: 'rgba(0,180,0,0.7)',
  }];
}

export function flattenMainLine(roots: MoveNode[]): MoveRecord[] {
  const result: MoveRecord[] = [];
  let children = roots;
  while (children.length > 0) {
    result.push(children[0]!.record);
    children = children[0]!.children;
  }
  return result;
}

function mainLineLength(roots: MoveNode[]): number {
  return flattenMainLine(roots).length;
}

// ── Store interface ─────────────────────────────────────────────────────────

interface AnalysisStore {
  game: SavedGame | null;
  currentPath: number[];
  isAnalyzing: boolean;
  analysisProgress: number;
  isDeepAnalyzing: boolean;
  deepAnalysisProgress: number;
  moves: MoveRecord[];        // flat main line (for graph)
  rootChildren: MoveNode[];   // tree with variations
  graphData: EvalPoint[];
  currentFen: string;
  currentArrows: Arrow[];
  isInVariation: boolean;

  loadGame: (game: SavedGame) => void;
  startAnalysis: () => Promise<void>;
  startDeepAnalysis: () => Promise<void>;
  cancelDeepAnalysis: () => void;
  playVariation: (from: string, to: string, promo?: string) => Promise<void>;
  goToPath: (path: number[]) => void;
  goToMove: (index: number) => void;  // main-line shortcut (for graph)
  goToMainLine: () => void;
  nextMove: () => void;
  prevMove: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  game: null,
  currentPath: [],
  isAnalyzing: false,
  analysisProgress: 0,
  isDeepAnalyzing: false,
  deepAnalysisProgress: 0,
  moves: [],
  rootChildren: [],
  graphData: [],
  currentFen: START_FEN,
  currentArrows: [],
  isInVariation: false,

  loadGame(game) {
    const moves = game.moves;
    const rootChildren = buildTree(moves);
    const initialPath = moves.length > 0 ? Array(moves.length).fill(0) : [];
    set({
      game,
      moves,
      rootChildren,
      graphData: moves.map((m, i) => ({
        moveIndex: i,
        san: m.san,
        evalPercent: scoreToPercent(m.evalCp, m.evalMate),
        evalCp: m.evalCp,
        evalMate: m.evalMate,
        color: m.color,
      })),
      currentPath: initialPath,
      currentFen: fenAtPath(rootChildren, initialPath),
      currentArrows: arrowsAtPath(rootChildren, initialPath),
      isInVariation: false,
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

      const rootChildren = buildTree(moves);
      const path = get().currentPath;
      const updatedGame: SavedGame = { ...game, moves, analyzed: true, accuracy };
      saveGame(updatedGame);

      set({
        game: updatedGame,
        moves,
        rootChildren,
        graphData,
        isAnalyzing: false,
        analysisProgress: 1,
        currentArrows: arrowsAtPath(rootChildren, path),
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

      const rootChildren = buildTree(moves);
      const path = get().currentPath;
      const updatedGame: SavedGame = { ...game, moves, analyzed: true, deepAnalyzed: true, accuracy };
      saveGame(updatedGame);

      set({
        game: updatedGame,
        moves,
        rootChildren,
        graphData,
        isDeepAnalyzing: false,
        deepAnalysisProgress: 1,
        currentArrows: arrowsAtPath(rootChildren, path),
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

  async playVariation(from, to, promo) {
    const { rootChildren, currentPath, game } = get();
    const fen = fenAtPath(rootChildren, currentPath);

    let record: MoveRecord;
    try {
      const chess = new Chess(fen);
      const moveResult = chess.move({ from, to, promotion: promo ?? 'q' });
      if (!moveResult) return;

      const newFen = chess.fen();
      const history = chess.history({ verbose: true });
      record = {
        san: moveResult.san,
        uci: from + to + (moveResult.promotion ?? ''),
        fen: newFen,
        evalCp: null,
        evalMate: null,
        classification: null,
        bestMoveSan: null,
        bestMoveUci: null,
        timeTakenMs: 0,
        moveNumber: Math.ceil(history.length / 2),
        color: moveResult.color,
      };
    } catch {
      return;
    }

    // Check if this move already exists as a child
    const currentNode = nodeAtPath(rootChildren, currentPath);
    const existingChildIdx = currentNode
      ? currentNode.children.findIndex((c) => c.record.uci === record.uci)
      : rootChildren.findIndex((c) => c.record.uci === record.uci);

    let newPath: number[];

    if (existingChildIdx >= 0) {
      newPath = [...currentPath, existingChildIdx];
    } else {
      // Add new child
      const newNode: MoveNode = { record, children: [] };
      const newRoots = JSON.parse(JSON.stringify(rootChildren)) as MoveNode[];

      if (currentPath.length === 0) {
        newRoots.push(newNode);
        newPath = [newRoots.length - 1];
      } else {
        const parent = nodeAtPath(newRoots, currentPath);
        if (!parent) return;
        parent.children.push(newNode);
        newPath = [...currentPath, parent.children.length - 1];
      }

      set({ rootChildren: newRoots });

      // Evaluate in fast mode asynchronously
      try {
        const sf = getStockfishService();
        await sf.waitReady();
        const uciMoves = flattenMainLine(newRoots).slice(0, newPath.reduce((sum, idx) => sum + (idx === 0 ? 1 : 0), 0));
        const allMoves: string[] = [];
        let cur: MoveNode[] = newRoots;
        for (const idx of newPath) {
          const n = cur[idx];
          if (!n) break;
          allMoves.push(n.record.uci);
          cur = n.children;
        }

        const evalResult = await sf.analyzePosition(START_FEN, allMoves, 12, 150);
        const evalCp = evalResult.score?.type === 'cp' ? evalResult.score.value : null;
        const evalMate = evalResult.score?.type === 'mate' ? evalResult.score.value : null;
        const bestMoveUci = evalResult.pv[0] ?? null;

        const updatedRoots = JSON.parse(JSON.stringify(get().rootChildren)) as MoveNode[];
        const targetNode = nodeAtPath(updatedRoots, newPath);
        if (targetNode) {
          targetNode.record.evalCp = evalCp;
          targetNode.record.evalMate = evalMate;
          targetNode.record.bestMoveUci = bestMoveUci;
        }
        set({ rootChildren: updatedRoots });
        newPath = newPath; // already set
      } catch {}
    }

    const { rootChildren: latestRoots } = get();
    const isVariation = newPath.some((idx) => idx > 0);
    set({
      currentPath: newPath,
      currentFen: fenAtPath(latestRoots, newPath),
      currentArrows: arrowsAtPath(latestRoots, newPath),
      isInVariation: isVariation,
    });
  },

  goToPath(path) {
    const { rootChildren } = get();
    const clamped = path.length === 0 ? [] : path;
    const isVariation = clamped.some((idx) => idx > 0);
    set({
      currentPath: clamped,
      currentFen: fenAtPath(rootChildren, clamped),
      currentArrows: arrowsAtPath(rootChildren, clamped),
      isInVariation: isVariation,
    });
  },

  goToMove(index) {
    // Navigate to position on main line (for graph clicks)
    if (index < 0) {
      get().goToPath([]);
      return;
    }
    get().goToPath(Array(index + 1).fill(0));
  },

  goToMainLine() {
    const { rootChildren } = get();
    const len = mainLineLength(rootChildren);
    get().goToPath(len > 0 ? Array(len).fill(0) : []);
  },

  nextMove() {
    const { currentPath, rootChildren } = get();
    const currentNode = nodeAtPath(rootChildren, currentPath);
    const hasChildren = currentNode
      ? currentNode.children.length > 0
      : rootChildren.length > 0;

    if (!hasChildren) return;
    get().goToPath([...currentPath, 0]);
  },

  prevMove() {
    const { currentPath } = get();
    if (currentPath.length === 0) return;
    get().goToPath(currentPath.slice(0, -1));
  },
}));
