interface PlayerCardProps {
  name: string;
  elo: number;
  isBot?: boolean;
  isActive?: boolean;
  capturedPieces?: string[];
}

const PIECE_UNICODE: Record<string, string> = {
  wP: '♙', wN: '♘', wB: '♗', wR: '♖', wQ: '♕',
  bP: '♟', bN: '♞', bB: '♝', bR: '♜', bQ: '♛',
};

export function PlayerCard({ name, elo, isBot = false, isActive = false, capturedPieces = [] }: PlayerCardProps) {
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ring-2 transition-all duration-200
        ${isActive ? 'ring-chess-accent-light' : 'ring-transparent'}
        ${isBot ? 'bg-accent-gradient text-white' : 'bg-chess-surface-alt text-chess-text-primary'}`}
      >
        {isBot ? '🤖' : name[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-chess-text-primary truncate">{name}</span>
          <span className="text-xs text-chess-text-muted">({elo})</span>
        </div>
        {capturedPieces.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {capturedPieces.map((p, i) => (
              <span key={i} className="text-xs leading-none opacity-70">
                {PIECE_UNICODE[p] ?? ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
