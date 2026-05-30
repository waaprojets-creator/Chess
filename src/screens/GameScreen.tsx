import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { useGameStore } from '@/store/gameStore';
import { getStockfishService } from '@/services/stockfishService';
import { getBotProfile } from '@/constants/elo';
import { saveGame } from '@/services/gameStorageService';
import { ChessBoard } from '@/components/board/ChessBoard';
import { EvalBar } from '@/components/board/EvalBar';
import { PlayerCard } from '@/components/game/PlayerCard';
import { ChessClock } from '@/components/game/ChessClock';
import { MoveList } from '@/components/game/MoveList';
import { GameControls } from '@/components/game/GameControls';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useChessClock } from '@/hooks/useChessClock';
import { useSounds } from '@/hooks/useSounds';
import { SettingsModal } from '@/components/ui/SettingsModal';
import type { MoveRecord, SavedGame } from '@/types/chess';

export default function GameScreen() {
  const navigate = useNavigate();
  const store = useGameStore();
  const isThinkingRef = useRef(false);
  // Timestamp marking when the side to move started thinking. Reset after every
  // recorded move (player or bot) so each player move's timeTakenMs reflects real
  // deliberation time — the basis for the decisional profile.
  const moveStartRef = useRef<number>(Date.now());
  const [showEndModal, setShowEndModal] = useState(false);
  const [boardWidth, setBoardWidth] = useState(360);
  const { play } = useSounds();
  const [showSettings, setShowSettings] = useState(false);

  useChessClock();

  // Resize board to fit the viewport (independent of the board itself, like
  // PuzzlesScreen/AnalysisScreen — measuring the flex wrapper races the board
  // and locks it tiny).
  useEffect(() => {
    function measure() {
      setBoardWidth(Math.min(window.innerWidth - 32, 400));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Show end modal
  useEffect(() => {
    if (store.phase === 'ended') {
      setShowEndModal(true);
      persistGame();
    }
  }, [store.phase]);

  // Start the deliberation clock when the game begins
  useEffect(() => {
    if (store.phase === 'playing') moveStartRef.current = Date.now();
  }, [store.phase]);

  const persistGame = useCallback(() => {
    const s = useGameStore.getState();
    if (!s.id || !s.endedAt) return;
    const saved: SavedGame = {
      id: s.id,
      pgn: s.chess.pgn(),
      moves: s.moves,
      result: s.result,
      endReason: s.endReason,
      playerColor: s.playerColor,
      botElo: s.botElo,
      timeControl: s.timeControl,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      analyzed: false,
      excludeFromProfile: s.excludeFromProfile,
    };
    saveGame(saved);
  }, []);

  // Handle player move
  const handleMove = useCallback(
    (from: string, to: string, promotion = 'q'): boolean => {
      const s = useGameStore.getState();
      if (s.phase !== 'playing') return false;
      if (!s.vsHuman && s.turn !== s.playerColor) return false;
      if (isThinkingRef.current) return false;

      const ok = store.makeMove(from, to, promotion);
      if (!ok) return false;

      // makeMove already applied the move to the store's shared chess instance.
      const state = useGameStore.getState();
      const chess = state.chess;
      const history = chess.history({ verbose: true });
      const lastMove = history[history.length - 1];
      if (!lastMove) return true;

      const record: MoveRecord = {
        san: lastMove.san,
        uci: from + to + (lastMove.promotion ?? ''),
        fen: chess.fen(),
        evalCp: null,
        evalMate: null,
        classification: null,
        bestMoveSan: null,
        bestMoveUci: null,
        timeTakenMs: Date.now() - moveStartRef.current,
        moveNumber: Math.ceil(history.length / 2),
        color: lastMove.color,
      };
      store.addMoveRecord(record);
      moveStartRef.current = Date.now();

      // Sound feedback
      if (chess.inCheck()) play('check');
      else if (lastMove.captured) play('capture');
      else play('move');

      // Check game end
      if (chess.isCheckmate()) {
        play('end');
        store.endGame(state.turn === 'w' ? 'black' : 'white', 'checkmate');
        return true;
      }
      if (chess.isDraw()) {
        play('end');
        const reason = chess.isStalemate() ? 'stalemate'
          : chess.isInsufficientMaterial() ? 'insufficient_material'
          : 'fifty_moves';
        store.endGame('draw', reason);
        return true;
      }

      // In local multiplayer: flip the board so the next player sees their side
      if (s.vsHuman) {
        store.flipBoard();
        return true;
      }

      // Bot move
      triggerBotMove();
      return true;
    },
    [store, play]
  );

  const triggerBotMove = useCallback(async () => {
    const s = useGameStore.getState();
    if (s.phase !== 'playing') return;
    if (s.vsHuman) return;
    if (isThinkingRef.current) return;
    isThinkingRef.current = true;

    try {
      const sf = getStockfishService();
      await sf.waitReady();

      const profile = getBotProfile(s.botElo);
      const uciMoves = s.moves.map((m) => m.uci);
      const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      const result = s.engineMode === 'human'
        ? await sf.getHumanMove(START, uciMoves, profile)
        : await sf.getBestMove(START, uciMoves, profile.movetime, profile.depth ?? undefined);

      // Update live eval
      if (result.score) {
        const cp = result.score.type === 'cp' ? result.score.value : null;
        const mate = result.score.type === 'mate' ? result.score.value : null;
        useGameStore.getState().setLiveEval(cp, mate);
      }

      const botUci = result.move;
      if (!botUci || botUci === '(none)') return;

      const from = botUci.slice(0, 2);
      const to = botUci.slice(2, 4);
      const promo = botUci[4] ?? 'q';

      const ok = useGameStore.getState().makeMove(from, to, promo);
      if (!ok) return;

      const newState = useGameStore.getState();
      const chess2 = newState.chess;
      const hist2 = chess2.history({ verbose: true });
      const botLastMove = hist2[hist2.length - 1];
      if (!botLastMove) return;

      const botRecord: MoveRecord = {
        san: botLastMove.san,
        uci: botUci,
        fen: chess2.fen(),
        evalCp: result.score?.type === 'cp' ? result.score.value : null,
        evalMate: result.score?.type === 'mate' ? result.score.value : null,
        classification: null,
        bestMoveSan: null,
        bestMoveUci: null,
        timeTakenMs: profile.movetime,
        moveNumber: Math.ceil(hist2.length / 2),
        color: botLastMove.color,
      };
      useGameStore.getState().addMoveRecord(botRecord);
      // Player's clock starts now that the board is theirs again
      moveStartRef.current = Date.now();

      if (chess2.inCheck()) play('check');
      else if (botLastMove.captured) play('capture');
      else play('move');

      if (chess2.isCheckmate()) {
        play('end');
        useGameStore.getState().endGame(newState.turn === 'w' ? 'black' : 'white', 'checkmate');
      } else if (chess2.isDraw()) {
        play('end');
        const reason = chess2.isStalemate() ? 'stalemate' : 'fifty_moves';
        useGameStore.getState().endGame('draw', reason);
      }
    } finally {
      isThinkingRef.current = false;
    }
  }, [play]);

  // Init stockfish when the game starts; if the bot is to move first
  // (player chose Black), kick off its opening move.
  useEffect(() => {
    if (store.phase !== 'playing') return;
    if (store.vsHuman) return;
    const sf = getStockfishService();
    sf.waitReady().then(() => {
      const profile = getBotProfile(store.botElo);
      sf.setBotProfile(profile);
      sf.newGame();
      const s = useGameStore.getState();
      if (s.moves.length === 0 && s.turn !== s.playerColor) {
        triggerBotMove();
      }
    });
  }, [store.phase, store.botElo, store.vsHuman, triggerBotMove]);

  // Redirect if no game
  useEffect(() => {
    if (store.phase === 'setup') navigate('/play', { replace: true });
  }, [store.phase, navigate]);

  const chess = new Chess(store.fen);
  const isInCheck = chess.inCheck();
  let kingCheckSquare: string | null = null;
  if (isInCheck) {
    const board = chess.board();
    const turnColor = store.turn;
    for (const row of board) {
      for (const sq of row) {
        if (sq && sq.type === 'k' && sq.color === turnColor) {
          kingCheckSquare = sq.square;
        }
      }
    }
  }

  const lastMoveSquares = store.moves.length > 0
    ? [store.moves[store.moves.length - 1]!.uci.slice(0, 2), store.moves[store.moves.length - 1]!.uci.slice(2, 4)] as [string, string]
    : null;

  const opponentColor = store.playerColor === 'w' ? 'b' : 'w';
  const opponentTimeMs = opponentColor === 'w' ? store.whiteTimeMs : store.blackTimeMs;
  const playerTimeMs = store.playerColor === 'w' ? store.whiteTimeMs : store.blackTimeMs;

  const endResultText = () => {
    if (!store.result) return 'Partie terminée';
    const isDraw = store.result === 'draw';
    if (isDraw) return 'Nulle !';
    if (store.vsHuman) return store.result === 'white' ? 'Les Blancs gagnent !' : 'Les Noirs gagnent !';
    const playerWon = (store.result === 'white' && store.playerColor === 'w') || (store.result === 'black' && store.playerColor === 'b');
    return playerWon ? 'Vous avez gagné !' : 'Vous avez perdu';
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#161513] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      {/* Sidebar layout on desktop, stacked on mobile */}
      <div className="flex flex-1 overflow-hidden">
        {/* Board area */}
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-3">
          {/* Opponent info */}
          <div className="flex w-full max-w-[440px] items-center justify-between rounded-2xl border border-chess-border/50 bg-surface-gradient px-3 py-1.5">
            <PlayerCard
              name={store.vsHuman ? 'Joueur 2' : `Bot ${store.botElo}`}
              elo={store.vsHuman ? 0 : store.botElo}
              isBot={!store.vsHuman}
              isActive={store.turn === opponentColor && store.phase === 'playing'}
            />
            <ChessClock
              timeMs={opponentTimeMs}
              isActive={store.turn === opponentColor && store.phase === 'playing'}
            />
          </div>

          {/* Board + eval bar */}
          <div className="flex items-center gap-2">
            <EvalBar
              evalCp={store.liveEvalCp}
              evalMate={store.liveEvalMate}
              flipped={store.boardFlipped}
              className="self-stretch"
            />
            <ChessBoard
              fen={store.fen}
              onMove={handleMove}
              boardFlipped={store.boardFlipped}
              interactive={store.phase === 'playing' && (store.vsHuman || store.turn === store.playerColor)}
              lastMoveSquares={lastMoveSquares}
              kingCheckSquare={kingCheckSquare}
              width={boardWidth - 28}
            />
          </div>

          {/* Player info */}
          <div className="flex w-full max-w-[440px] items-center justify-between rounded-2xl border border-chess-border/50 bg-surface-gradient px-3 py-1.5">
            <PlayerCard
              name="Vous"
              elo={1200}
              isActive={store.turn === store.playerColor && store.phase === 'playing'}
            />
            <ChessClock
              timeMs={playerTimeMs}
              isActive={store.turn === store.playerColor && store.phase === 'playing'}
            />
          </div>
        </div>

        {/* Side panel — hidden on very small screens, shown on md+ */}
        <div className="hidden md:flex flex-col w-60 bg-chess-surface/60 border-l border-chess-border p-3 gap-3">
          <MoveList moves={store.moves} />
          <GameControls
            phase={store.phase}
            onResign={store.resign}
            onFlip={store.flipBoard}
            onAnalyze={() => {
              const s = useGameStore.getState();
              const id = s.id;
              navigate(`/analysis?gameId=${id}`);
            }}
          />
        </div>
      </div>

      {/* Mobile move list bar — fixed height, horizontal scroll */}
      <div className="md:hidden h-12 glass border-t border-chess-border flex items-center gap-2 px-2 shrink-0">
        <MoveList moves={store.moves} compact />
        <button
          onClick={() => setShowSettings(true)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-chess-text-muted hover:text-chess-text-primary"
          title="Paramètres"
        >
          ⚙
        </button>
        <GameControls
          phase={store.phase}
          onResign={store.resign}
          onFlip={store.flipBoard}
        />
      </div>

      {/* End game modal */}
      <Modal open={showEndModal} title={endResultText()}>
        <div className="space-y-3">
          <p className="text-chess-text-secondary text-sm">
            {store.endReason === 'checkmate' && 'Échec et mat'}
            {store.endReason === 'timeout' && 'Temps écoulé'}
            {store.endReason === 'resignation' && 'Abandon'}
            {store.endReason === 'stalemate' && 'Pat'}
            {store.endReason === 'insufficient_material' && 'Matériel insuffisant'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setShowEndModal(false);
                const id = useGameStore.getState().id;
                navigate(`/analysis?gameId=${id}`);
              }}
            >
              Analyser
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowEndModal(false);
                store.reset();
                navigate('/play');
              }}
            >
              Rejouer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
