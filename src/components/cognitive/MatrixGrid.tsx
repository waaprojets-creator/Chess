import type { MatrixCell } from '@/types/chess';
import { MatrixCellView } from './MatrixCell';

interface Props {
  grid: (MatrixCell | null)[][];
  cellSize?: number;
}

export function MatrixGrid({ grid, cellSize = 56 }: Props) {
  const gap = 4;
  return (
    <div
      style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(3, ${cellSize}px)`,
        gap,
        padding: gap,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {grid.map((row, ri) =>
        row.map((cell, ci) => (
          <MatrixCellView
            key={`${ri}-${ci}`}
            cell={cell}
            cellSize={cellSize}
          />
        ))
      )}
    </div>
  );
}
