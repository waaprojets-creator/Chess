import type { MatrixCell as MatrixCellType } from '@/types/chess';

interface Props {
  cell: MatrixCellType | null;
  cellSize?: number;
  selected?: boolean;
  highlight?: 'correct' | 'wrong';
  onClick?: () => void;
}

const SIZE_PX: Record<string, number> = { sm: 14, md: 22, lg: 32 };

function ShapeEl({
  shape, fill, sizePx, rotation = 0, count = 1, color,
}: {
  shape: MatrixCellType['shape'];
  fill: MatrixCellType['fill'];
  sizePx: number;
  rotation?: number;
  count?: number;
  color: string;
}) {
  const s = sizePx;
  const isFilled = fill === 'solid';
  const isStriped = fill === 'striped';

  function renderShape(cx: number, cy: number, key: string) {
    const id = `stripe_${key}`;
    const stroke = color;
    const fillAttr = isFilled ? color : 'none';

    const shapeEl = (() => {
      switch (shape) {
        case 'circle':
          return <circle cx={cx} cy={cy} r={s / 2} fill={fillAttr} stroke={stroke} strokeWidth={1.5} />;
        case 'square':
          return (
            <rect
              x={cx - s / 2} y={cy - s / 2} width={s} height={s}
              fill={fillAttr} stroke={stroke} strokeWidth={1.5}
              transform={rotation ? `rotate(${rotation},${cx},${cy})` : undefined}
            />
          );
        case 'triangle': {
          const h = (s * Math.sqrt(3)) / 2;
          const pts = `${cx},${cy - h / 2} ${cx - s / 2},${cy + h / 2} ${cx + s / 2},${cy + h / 2}`;
          return (
            <polygon
              points={pts} fill={fillAttr} stroke={stroke} strokeWidth={1.5}
              transform={rotation ? `rotate(${rotation},${cx},${cy})` : undefined}
            />
          );
        }
        case 'diamond': {
          const pts = `${cx},${cy - s / 2} ${cx + s / 2},${cy} ${cx},${cy + s / 2} ${cx - s / 2},${cy}`;
          return (
            <polygon
              points={pts} fill={fillAttr} stroke={stroke} strokeWidth={1.5}
              transform={rotation ? `rotate(${rotation},${cx},${cy})` : undefined}
            />
          );
        }
        case 'cross': {
          const t2 = s * 0.28;
          const pts = `${cx - t2},${cy - s / 2} ${cx + t2},${cy - s / 2} ${cx + t2},${cy - t2}
            ${cx + s / 2},${cy - t2} ${cx + s / 2},${cy + t2} ${cx + t2},${cy + t2}
            ${cx + t2},${cy + s / 2} ${cx - t2},${cy + s / 2} ${cx - t2},${cy + t2}
            ${cx - s / 2},${cy + t2} ${cx - s / 2},${cy - t2} ${cx - t2},${cy - t2}`;
          return <polygon points={pts} fill={fillAttr} stroke={stroke} strokeWidth={1} />;
        }
        case 'none':
        default:
          return null;
      }
    })();

    if (!isStriped || shape === 'none') return shapeEl;

    // Striped: clip the diagonal lines to the shape boundary
    return (
      <g key={key}>
        <defs>
          <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform={`rotate(45)`}>
            <line x1="0" y1="0" x2="0" y2="4" stroke={color} strokeWidth="1.5" />
          </pattern>
          <clipPath id={`clip_${key}`}>
            {shapeEl && <>{shapeEl}</>}
          </clipPath>
        </defs>
        {/* outline */}
        {shapeEl}
        {/* stripes clipped */}
        <rect
          x={cx - s / 2 - 2} y={cy - s / 2 - 2} width={s + 4} height={s + 4}
          fill={`url(#${id})`}
          clipPath={`url(#clip_${key})`}
        />
      </g>
    );
  }

  if (count === 1) return <>{renderShape(0, 0, `${shape}_1`)}</>;

  if (count === 2) {
    const gap = s * 0.65;
    return (
      <>
        {renderShape(-gap / 2, 0, `${shape}_a`)}
        {renderShape(gap / 2, 0, `${shape}_b`)}
      </>
    );
  }

  // count === 3
  const gap = s * 0.6;
  return (
    <>
      {renderShape(0, -gap / 2, `${shape}_a`)}
      {renderShape(-gap / 2, gap / 2, `${shape}_b`)}
      {renderShape(gap / 2, gap / 2, `${shape}_c`)}
    </>
  );
}

export function MatrixCellView({ cell, cellSize = 56, selected, highlight, onClick }: Props) {
  const bg = highlight === 'correct'
    ? '#1baca620' : highlight === 'wrong'
    ? '#cc323220' : selected
    ? 'rgba(143,184,110,0.18)' : 'rgba(255,255,255,0.04)';

  const border = highlight === 'correct'
    ? '#1baca6' : highlight === 'wrong'
    ? '#cc3232' : selected
    ? '#8fb86e' : 'rgba(255,255,255,0.14)';

  const half = cellSize / 2;

  return (
    <svg
      width={cellSize} height={cellSize}
      viewBox={`${-half} ${-half} ${cellSize} ${cellSize}`}
      style={{
        borderRadius: 6,
        background: bg,
        border: `1.5px solid ${border}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onClick={onClick}
    >
      {cell === null ? (
        <text
          x="0" y="5" textAnchor="middle" fontSize="18" fill="rgba(255,255,255,0.35)"
          fontWeight="bold"
        >?</text>
      ) : cell.shape === 'none' ? null : (
        <ShapeEl
          shape={cell.shape}
          fill={cell.fill}
          sizePx={SIZE_PX[cell.size] ?? 22}
          rotation={cell.rotation}
          count={cell.count ?? 1}
          color="rgba(240,230,215,0.90)"
        />
      )}
    </svg>
  );
}
