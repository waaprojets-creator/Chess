export type ScoreInfo =
  | { type: 'cp'; value: number }
  | { type: 'mate'; value: number };

export interface PvLine {
  score: ScoreInfo;
  pv: string[];
}

export type WorkerCommand =
  | { type: 'init' }
  | { type: 'setElo'; elo: number }
  | { type: 'setPosition'; fen: string; moves?: string[] }
  | { type: 'go'; movetime?: number; depth?: number }
  | { type: 'stop' }
  | { type: 'quit' };

export type WorkerEvent =
  | { type: 'ready' }
  | { type: 'bestmove'; move: string; ponder: string | null; score: ScoreInfo | null }
  | { type: 'info'; depth: number; score: ScoreInfo; pv: string[]; multipv?: number }
  | { type: 'error'; message: string };
