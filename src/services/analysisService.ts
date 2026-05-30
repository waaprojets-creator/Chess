import { Chess } from 'chess.js';
import type { MoveRecord, EvalPoint, PieceColor, SavedGame } from '@/types/chess';
import { classifyMove, scoreToPercent } from '@/constants/classification';
import type { StockfishService } from './stockfishService';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type AnalysisMode = 'fast' | 'deep';

function cpLossToAccuracy(cpLoss: number): number {
  if (cpLoss <= 0) return 100;
  return Math.max(0, Math.round(100 - Math.min(100, cpLoss / 4)));
}

export async function analyzeGame(
  game: SavedGame,
  stockfish: StockfishService,
  onProgress?: (idx: number, total: number) => void,
  mode: AnalysisMode = 'fast',
  signal?: { cancelled: boolean }
): Promise<{ moves: MoveRecord[]; graphData: EvalPoint[]; accuracy: { white: number; black: number } }> {
  const moves = game.moves.map((m) => ({ ...m }));
  const graphData: EvalPoint[] = [];
  const uciMoves: string[] = [];
  const accScores: { w: number[]; b: number[] } = { w: [], b: [] };

  const DEPTH = mode === 'fast' ? 12 : 18;
  const MOVETIME = mode === 'fast' ? 150 : Math.min(900, Math.floor(38000 / Math.max(1, moves.length)));

  let prevAnalysis = await stockfish.analyzePosition(START_FEN, [], DEPTH, MOVETIME);
  let prevEvalCpWhite =
    prevAnalysis.score?.type === 'cp'
      ? prevAnalysis.score.value
      : prevAnalysis.score?.type === 'mate'
      ? prevAnalysis.score.value > 0 ? 15000 : -15000
      : 0;

  for (let i = 0; i < moves.length; i++) {
    if (signal?.cancelled) break;

    const move = moves[i]!;
    uciMoves.push(move.uci);

    onProgress?.(i + 1, moves.length);

    // Best move from the PREVIOUS position — reuse last iteration's result
    const bestUci = prevAnalysis.pv[0] ?? '';

    // Eval at the position after this move
    const result = await stockfish.analyzePosition(START_FEN, uciMoves, DEPTH, MOVETIME);

    const score = result.score;
    const evalCp = score?.type === 'cp' ? score.value : null;
    const evalMate = score?.type === 'mate' ? score.value : null;
    const evalCpWhite =
      evalCp !== null ? evalCp : evalMate !== null ? (evalMate > 0 ? 15000 : -15000) : 0;

    // cp loss from the moving player's perspective (centipawns — thresholds match)
    const movingColor: PieceColor = move.color;
    const prevFromSide = movingColor === 'w' ? prevEvalCpWhite : -prevEvalCpWhite;
    const afterFromSide = movingColor === 'w' ? evalCpWhite : -evalCpWhite;
    const cpLoss = prevFromSide - afterFromSide;

    // Convert best UCI to SAN using the FEN just before this move
    const fenBeforeMove = i === 0 ? START_FEN : (moves[i - 1]?.fen ?? START_FEN);
    let bestMoveSan: string | null = null;
    try {
      if (bestUci) {
        const chessForSan = new Chess(fenBeforeMove);
        const from = bestUci.slice(0, 2);
        const to = bestUci.slice(2, 4);
        const promotion = bestUci[4] as string | undefined;
        const m = chessForSan.move({ from, to, ...(promotion ? { promotion } : {}) });
        bestMoveSan = m?.san ?? null;
      }
    } catch {}

    // Brilliant: sacrifice (captured piece) + near-zero cp loss + not the engine's best choice
    let hasSacrifice = false;
    try {
      const chessForCapture = new Chess(fenBeforeMove);
      const from = move.uci.slice(0, 2);
      const to = move.uci.slice(2, 4);
      const promotion = move.uci[4] as string | undefined;
      const verboseMove = chessForCapture.move({ from, to, ...(promotion ? { promotion } : {}) });
      hasSacrifice = !!verboseMove?.captured;
    } catch {}

    const isBrilliant = hasSacrifice && cpLoss <= 5 && move.uci !== bestUci;

    const classification = classifyMove(prevFromSide, afterFromSide, move.uci, bestUci, isBrilliant);

    accScores[movingColor].push(cpLossToAccuracy(cpLoss));

    moves[i] = { ...move, evalCp, evalMate, classification, bestMoveSan, bestMoveUci: bestUci };

    graphData.push({
      moveIndex: i,
      san: move.san,
      evalPercent: scoreToPercent(evalCp, evalMate),
      evalCp,
      evalMate,
      color: movingColor,
    });

    prevEvalCpWhite = evalCpWhite;
    prevAnalysis = result;
  }

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return { moves, graphData, accuracy: { white: avg(accScores.w), black: avg(accScores.b) } };
}
