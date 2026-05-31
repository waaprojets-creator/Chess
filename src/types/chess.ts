export type PieceColor = 'w' | 'b';

export type EngineMode = 'stockfish' | 'human';

export interface TimeControl {
  minutes: number;
  increment: number;
  label: string;
}

export type GamePhase = 'setup' | 'playing' | 'ended';

export type GameResult = 'white' | 'black' | 'draw' | null;

export type GameEndReason =
  | 'checkmate'
  | 'stalemate'
  | 'timeout'
  | 'resignation'
  | 'draw_agreement'
  | 'insufficient_material'
  | 'threefold_repetition'
  | 'fifty_moves';

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'forced'
  | 'book';

export interface MoveRecord {
  san: string;
  uci: string;
  fen: string;
  evalCp: number | null;
  evalMate: number | null;
  classification: MoveClassification | null;
  bestMoveSan: string | null;
  bestMoveUci: string | null;
  timeTakenMs: number;
  moveNumber: number;
  color: PieceColor;
}

export interface Arrow {
  from: string;
  to: string;
  color?: string;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  fen: string;
  moves: MoveRecord[];
  turn: PieceColor;
  result: GameResult;
  endReason: GameEndReason | null;
  playerColor: PieceColor;
  botElo: number;
  timeControl: TimeControl;
  whiteTimeMs: number;
  blackTimeMs: number;
  startedAt: number;
  endedAt: number | null;
  boardFlipped: boolean;
  vsHuman: boolean;
  engineMode: EngineMode;
  excludeFromProfile: boolean;
}

export interface MoveNode {
  record: MoveRecord;
  children: MoveNode[];
}

export interface SavedGame {
  id: string;
  pgn: string;
  moves: MoveRecord[];
  result: GameResult;
  endReason: GameEndReason | null;
  playerColor: PieceColor;
  botElo: number;
  timeControl: TimeControl;
  startedAt: number;
  endedAt: number | null;
  analyzed: boolean;
  deepAnalyzed?: boolean;
  accuracy?: { white: number; black: number };
  excludeFromProfile?: boolean;
}

export interface PuzzleEntry {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
}

export interface EvalPoint {
  moveIndex: number;
  san: string;
  evalPercent: number;
  evalCp: number | null;
  evalMate: number | null;
  color: PieceColor;
}

// ---- Cognitive test types ----

export type CellShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'none';
export type CellFill  = 'solid' | 'outline' | 'striped';
export type CellSize  = 'sm' | 'md' | 'lg';

export interface MatrixCell {
  shape: CellShape;
  fill: CellFill;
  size: CellSize;
  rotation?: 0 | 45 | 90 | 135;
  count?: 1 | 2 | 3;
}

export interface CognitiveItem {
  id: string;
  // 3×3 grid; position [2][2] is the missing cell (rendered as '?')
  grid: (MatrixCell | null)[][];
  options: MatrixCell[]; // 5 choices
  correctIndex: number;
  irt: { a: number; b: number; c: number };
  domain: 'Gf' | 'Gv';
}

export type CognitiveBand =
  | 'below_average'
  | 'average'
  | 'above_average'
  | 'high'
  | 'very_high';

export interface CognitiveSession {
  id: string;
  startedAt: number;
  completedAt: number | null;
  itemCount: number;
  thetaFinal: number | null;
  band: CognitiveBand | null;
  percentile: number | null;
}
