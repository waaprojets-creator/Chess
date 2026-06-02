import type { WorkerEvent, ScoreInfo, PvLine } from '@/types/stockfish';
import type { BotProfile } from '@/constants/elo';

type EventHandler = (e: WorkerEvent) => void;

/**
 * The stockfish-nnue-16-single.js build (nmrugg/stockfish.js) IS itself a Web
 * Worker: loaded via `new Worker(...)` it auto-starts in worker context and
 * speaks raw UCI strings over postMessage. We therefore load it directly and
 * do the UCI <-> structured-event translation here, on the main thread.
 */
export class StockfishService {
  private worker: Worker;
  private handlers: EventHandler[] = [];
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  private initialized = false;
  private lastScore: ScoreInfo | null = null;
  private pvLines: Map<number, PvLine> = new Map();

  constructor() {
    const engineUrl = `${import.meta.env.BASE_URL}stockfish/stockfish-nnue-16-single.js`;
    this.worker = new Worker(engineUrl);
    this.readyPromise = new Promise((res) => { this.readyResolve = res; });

    this.worker.onmessage = (e: MessageEvent) => {
      const line = typeof e.data === 'string' ? e.data : (e.data && e.data.data) || '';
      this.handleLine(line);
    };

    this.worker.onerror = (err) => {
      console.error('[Stockfish] Worker error', err);
      this.emit({ type: 'error', message: err.message || 'Worker error' });
    };

    // Boot the UCI engine.
    this.send('uci');
    this.send('isready');
  }

  private send(cmd: string): void {
    this.worker.postMessage(cmd);
  }

  private emit(event: WorkerEvent): void {
    if (event.type === 'ready') this.readyResolve();
    this.handlers.forEach((h) => h(event));
  }

  /** Parse a single raw UCI output line into a structured WorkerEvent. */
  private handleLine(line: string): void {
    if (!line) return;

    if (line === 'readyok' || line === 'uciok') {
      if (!this.initialized) {
        this.initialized = true;
        this.emit({ type: 'ready' });
      }
      return;
    }

    if (line.startsWith('bestmove')) {
      const parts = line.split(' ');
      const move = parts[1] || '';
      const ponder = parts[3] || null;
      this.emit({ type: 'bestmove', move, ponder, score: this.lastScore });
      this.lastScore = null;
      this.pvLines.clear();
      return;
    }

    if (line.startsWith('info') && line.includes(' score ') && !line.includes(' currmove ')) {
      const depthM = line.match(/depth (\d+)/);
      if (!depthM) return;
      const cpM = line.match(/score cp (-?\d+)/);
      const mateM = line.match(/score mate (-?\d+)/);
      const pvM = line.match(/ pv (.+?)(?= bm| string|$)/);
      const multipvM = line.match(/multipv (\d+)/);

      const depth = parseInt(depthM[1]!, 10);
      const pv = pvM ? pvM[1]!.trim().split(' ') : [];
      const multipvIdx = multipvM ? parseInt(multipvM[1]!, 10) : 1;

      let score: ScoreInfo | null = null;
      if (cpM) {
        score = { type: 'cp', value: parseInt(cpM[1]!, 10) };
      } else if (mateM) {
        score = { type: 'mate', value: parseInt(mateM[1]!, 10) };
      }

      if (score) {
        this.lastScore = multipvIdx === 1 ? score : this.lastScore;
        this.pvLines.set(multipvIdx, { score, pv });
        this.emit({ type: 'info', depth, score, pv, multipv: multipvIdx });
      }
    }
  }

  onEvent(handler: EventHandler): () => void {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter((h) => h !== handler); };
  }

  waitReady(): Promise<void> {
    return this.readyPromise;
  }

  setBotProfile(profile: BotProfile): void {
    this.send('setoption name UCI_LimitStrength value true');
    this.send(`setoption name UCI_Elo value ${profile.uciElo}`);
    this.send(`setoption name Skill Level value ${profile.skillLevel}`);
    this.send('isready');
  }

  setPosition(fen: string, moves: string[] = []): void {
    const moveStr = moves.length ? ` moves ${moves.join(' ')}` : '';
    this.send(`position fen ${fen}${moveStr}`);
  }

  go(movetime?: number, depth?: number): void {
    let cmd = 'go';
    if (movetime) cmd += ` movetime ${movetime}`;
    if (depth) cmd += ` depth ${depth}`;
    if (!movetime && !depth) cmd += ' movetime 3000';
    this.send(cmd);
  }

  stop(): void {
    this.send('stop');
  }

  newGame(): void {
    this.send('ucinewgame');
    this.send('isready');
  }

  getBestMove(
    fen: string,
    moves: string[],
    movetime: number,
    depth?: number
  ): Promise<{ move: string; score: ScoreInfo | null }> {
    return new Promise((resolve) => {
      const off = this.onEvent((e) => {
        if (e.type === 'bestmove') {
          off();
          resolve({ move: e.move, score: e.score });
        }
      });
      this.setPosition(fen, moves);
      this.go(movetime, depth);
    });
  }

  analyzePosition(
    fen: string,
    moves: string[],
    depth = 18,
    movetime = 1000
  ): Promise<{ score: ScoreInfo | null; pv: string[] }> {
    return new Promise((resolve) => {
      let lastScore: ScoreInfo | null = null;
      let lastPv: string[] = [];

      const off = this.onEvent((e) => {
        if (e.type === 'info') {
          lastScore = e.score;
          lastPv = e.pv;
        }
        if (e.type === 'bestmove') {
          off();
          resolve({ score: lastScore, pv: lastPv });
        }
      });
      this.setPosition(fen, moves);
      this.go(movetime, depth);
    });
  }

  setMultiPV(n: number): void {
    this.send(`setoption name MultiPV value ${n}`);
  }

  getHumanMove(
    fen: string,
    moves: string[],
    profile: BotProfile
  ): Promise<{ move: string; score: ScoreInfo | null }> {
    return new Promise((resolve) => {
      const lines = new Map<number, PvLine>();

      const off = this.onEvent((e) => {
        if (e.type === 'info' && e.multipv !== undefined) {
          lines.set(e.multipv, { score: e.score, pv: e.pv });
        }
        if (e.type === 'bestmove') {
          off();
          this.setMultiPV(1);

          const candidates: Array<{ move: string; score: ScoreInfo }> = [];
          for (const [, line] of lines) {
            if (line.pv[0]) candidates.push({ move: line.pv[0], score: line.score });
          }

          if (candidates.length === 0) {
            resolve({ move: e.move, score: e.score });
            return;
          }

          // Weight selection by Elo — lower Elo = more random
          const elo = profile.elo;
          const weights =
            elo <= 800  ? [40, 35, 25] :
            elo <= 1400 ? [60, 28, 12] :
                          [85, 12,  3];

          const pool: string[] = [];
          candidates.forEach((c, i) => {
            const w = weights[i] ?? 3;
            for (let j = 0; j < w; j++) pool.push(c.move);
          });

          const chosen = pool[Math.floor(Math.random() * pool.length)]!;
          const chosenLine = candidates.find((c) => c.move === chosen);
          resolve({ move: chosen, score: chosenLine?.score ?? null });
        }
      });

      this.setMultiPV(3);
      this.setPosition(fen, moves);
      this.go(profile.movetime, profile.depth ?? undefined);
    });
  }

  destroy(): void {
    this.worker.terminate();
  }
}

let instance: StockfishService | null = null;

export function getStockfishService(): StockfishService {
  if (!instance) instance = new StockfishService();
  return instance;
}

export function destroyStockfishService(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
