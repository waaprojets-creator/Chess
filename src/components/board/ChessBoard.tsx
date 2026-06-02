import { useCallback, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Arrow as RCBArrow } from 'react-chessboard/dist/chessboard/types';
import type { Arrow } from '@/types/chess';
import { useSettingsStore } from '@/store/settingsStore';
import { BOARD_THEMES } from '@/constants/boardThemes';

interface ChessBoardProps {
  fen: string;
  onMove?: (from: string, to: string, promotion?: string) => boolean;
  boardFlipped?: boolean;
  arrows?: Arrow[];
  highlightSquares?: string[];
  interactive?: boolean;
  lastMoveSquares?: [string, string] | null;
  kingCheckSquare?: string | null;
  width?: number;
}

export function ChessBoard({
  fen,
  onMove,
  boardFlipped = false,
  arrows = [],
  interactive = true,
  lastMoveSquares = null,
  kingCheckSquare = null,
  width,
}: ChessBoardProps) {
  const boardTheme = useSettingsStore((s) => s.boardTheme);
  const theme = BOARD_THEMES[boardTheme];

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);

  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string, piece: string): boolean => {
      if (!onMove) return false;
      setSelectedSquare(null);
      setLegalTargets([]);
      const isPromotion =
        piece.slice(1) === 'P' &&
        ((piece[0] === 'w' && targetSquare[1] === '8') ||
          (piece[0] === 'b' && targetSquare[1] === '1'));
      return onMove(sourceSquare, targetSquare, isPromotion ? 'q' : undefined);
    },
    [onMove]
  );

  const handleSquareClick = useCallback(
    (square: string) => {
      if (!interactive || !onMove) return;

      const sq = square as Square;

      // If there's already a selected square, try to move there
      if (selectedSquare) {
        if (legalTargets.includes(square)) {
          // Check if it's a promotion
          let promotion: string | undefined;
          try {
            const chess = new Chess(fen);
            const piece = chess.get(selectedSquare as Square);
            if (
              piece?.type === 'p' &&
              ((piece.color === 'w' && square[1] === '8') ||
                (piece.color === 'b' && square[1] === '1'))
            ) {
              promotion = 'q';
            }
          } catch {}

          onMove(selectedSquare, square, promotion);
          setSelectedSquare(null);
          setLegalTargets([]);
          return;
        }

        // Clicked another square — deselect then try to select new piece
        setSelectedSquare(null);
        setLegalTargets([]);
      }

      // Try to select a piece on this square
      try {
        const chess = new Chess(fen);
        const piece = chess.get(sq);
        if (piece && piece.color === chess.turn()) {
          const legalMoves = chess.moves({ square: sq, verbose: true });
          if (legalMoves.length > 0) {
            setSelectedSquare(square);
            setLegalTargets(legalMoves.map((m) => m.to));
          }
        }
      } catch {}
    },
    [selectedSquare, legalTargets, fen, interactive, onMove]
  );

  const customSquareStyles: Record<string, React.CSSProperties> = {};

  if (lastMoveSquares) {
    customSquareStyles[lastMoveSquares[0]] = { background: 'rgba(204, 210, 56, 0.4)' };
    customSquareStyles[lastMoveSquares[1]] = { background: 'rgba(204, 210, 56, 0.4)' };
  }

  if (kingCheckSquare) {
    customSquareStyles[kingCheckSquare] = {
      background: 'radial-gradient(circle, rgba(220,50,50,0.9) 0%, rgba(220,50,50,0) 75%)',
    };
  }

  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      background: 'rgba(20, 85, 30, 0.5)',
    };
  }

  for (const sq of legalTargets) {
    customSquareStyles[sq] = {
      // Dot in centre for empty squares, ring for occupied ones
      background: customSquareStyles[sq]
        ? `${customSquareStyles[sq].background}, radial-gradient(circle, rgba(0,0,0,0.25) 22%, transparent 22%)`
        : 'radial-gradient(circle, rgba(0,0,0,0.18) 22%, transparent 22%)',
      cursor: 'pointer',
    };
  }

  const rcbArrows: RCBArrow[] = arrows.map(
    (a) => [a.from, a.to, a.color ?? 'rgba(0,180,0,0.7)'] as RCBArrow
  );

  return (
    <div className="board-container">
      <Chessboard
        position={fen}
        onPieceDrop={interactive ? handlePieceDrop : undefined}
        onSquareClick={interactive ? handleSquareClick : undefined}
        boardOrientation={boardFlipped ? 'black' : 'white'}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
        customLightSquareStyle={{ backgroundColor: theme.light }}
        customDarkSquareStyle={{ backgroundColor: theme.dark }}
        customSquareStyles={customSquareStyles}
        customArrows={rcbArrows}
        boardWidth={width}
        animationDuration={100}
        promotionDialogVariant="modal"
        areArrowsAllowed={false}
        arePremovesAllowed={interactive}
        isDraggablePiece={() => interactive}
      />
    </div>
  );
}
