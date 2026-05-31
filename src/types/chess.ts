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

export interface CognitiveItem {
  id: string;
  gridImage: string;       // path to 308×308 PNG (e.g. '/Chess/cognitive/grids/A1_1.png')
  optionImages: string[];  // 8 option PNG paths (102×103 each)
  correctIndex: number;    // 0-based index into optionImages
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
