import { forwardRef, useEffect, useRef } from 'react';
import type { MoveRecord, MoveNode } from '@/types/chess';
import { CLASSIFICATION_META } from '@/constants/classification';

interface MoveListProps {
  moves: MoveRecord[];
  currentIndex?: number;
  onMoveClick?: (index: number) => void;
  compact?: boolean;
}

export function MoveList({ moves, currentIndex = -1, onMoveClick, compact = false }: MoveListProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [currentIndex]);

  if (compact) {
    if (moves.length === 0) {
      return (
        <div className="flex-1 flex items-center text-chess-text-muted text-xs px-1 min-w-0">
          Aucun coup
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center gap-0.5 overflow-x-auto text-xs min-w-0 py-0.5 scrollbar-hide">
        {moves.map((move, idx) => {
          const isActive = currentIndex === idx;
          const meta = move.classification ? CLASSIFICATION_META[move.classification] : null;
          return (
            <button
              key={idx}
              ref={isActive ? activeRef : undefined}
              onClick={() => onMoveClick?.(idx)}
              className={`
                shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors
                ${isActive
                  ? 'bg-chess-accent text-white font-semibold'
                  : 'text-chess-text-primary hover:bg-chess-surface-hover'}
              `}
            >
              {move.color === 'w' && (
                <span className={`${isActive ? 'text-white/70' : 'text-chess-text-muted'}`}>
                  {move.moveNumber}.
                </span>
              )}
              <span className="font-medium">{move.san}</span>
              {meta?.symbol && (
                <span className="font-bold" style={{ color: isActive ? 'white' : meta.color }}>
                  {meta.symbol}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  const pairs: [MoveRecord, MoveRecord | null][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i]!, moves[i + 1] ?? null]);
  }

  if (pairs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-chess-text-muted text-sm">
        Aucun coup joué
      </div>
    );
  }

  return (
    <div className="move-list overflow-y-auto flex-1 text-sm">
      {pairs.map(([white, black], pairIdx) => {
        const wIdx = pairIdx * 2;
        const bIdx = pairIdx * 2 + 1;

        return (
          <div
            key={pairIdx}
            className={`flex items-center gap-1 ${pairIdx % 2 === 0 ? 'bg-transparent' : 'bg-chess-surface-alt/30'}`}
          >
            <span className="w-7 text-chess-text-muted text-center shrink-0 py-0.5">
              {pairIdx + 1}.
            </span>
            <MoveButton
              move={white}
              index={wIdx}
              isActive={currentIndex === wIdx}
              onClick={onMoveClick}
              ref={currentIndex === wIdx ? activeRef : undefined}
            />
            {black && (
              <MoveButton
                move={black}
                index={bIdx}
                isActive={currentIndex === bIdx}
                onClick={onMoveClick}
                ref={currentIndex === bIdx ? activeRef : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface MoveBtnProps {
  move: MoveRecord;
  index: number;
  isActive: boolean;
  onClick?: (i: number) => void;
}

const MoveButton = forwardRef<HTMLButtonElement, MoveBtnProps>(function MoveButton(
  { move, index, isActive, onClick },
  ref
) {
  const meta = move.classification ? CLASSIFICATION_META[move.classification] : null;

  return (
    <button
      ref={ref}
      onClick={() => onClick?.(index)}
      className={`
        flex-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-left
        transition-colors duration-100
        ${isActive
          ? 'bg-chess-accent text-white font-semibold'
          : 'text-chess-text-primary hover:bg-chess-surface-hover'}
      `}
    >
      <span className="font-medium">{move.san}</span>
      {meta?.symbol && (
        <span
          className="text-xs font-bold"
          style={{ color: isActive ? 'white' : meta.color }}
        >
          {meta.symbol}
        </span>
      )}
    </button>
  );
});

// ── Tree move list (for analysis screen) ────────────────────────────────────

interface TreeMoveListProps {
  rootChildren: MoveNode[];
  currentPath: number[];
  onNavigate: (path: number[]) => void;
}

export function TreeMoveList({ rootChildren, currentPath, onNavigate }: TreeMoveListProps) {
  const activeRef = useRef<HTMLButtonElement>(null) as React.RefObject<HTMLButtonElement>;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [currentPath]);

  if (rootChildren.length === 0) {
    return (
      <div className="flex items-center justify-center text-chess-text-muted text-sm py-4">
        Aucun coup joué
      </div>
    );
  }

  return (
    <div className="overflow-y-auto text-sm">
      <TreeLine nodes={rootChildren} pathPrefix={[]} currentPath={currentPath} onNavigate={onNavigate} activeRef={activeRef} />
    </div>
  );
}

interface TreeLineProps {
  nodes: MoveNode[];
  pathPrefix: number[];
  currentPath: number[];
  onNavigate: (path: number[]) => void;
  activeRef: React.RefObject<HTMLButtonElement>;
  depth?: number;
}

function TreeLine({ nodes, pathPrefix, currentPath, onNavigate, activeRef, depth = 0 }: TreeLineProps) {
  if (nodes.length === 0) return null;

  // Render the main line (nodes[0]) as a flat sequence
  const mainLineElems: React.ReactNode[] = [];
  let current: MoveNode[] = nodes;
  let pathSoFar = [...pathPrefix];

  while (current.length > 0) {
    const node = current[0]!;
    pathSoFar = [...pathSoFar, 0];
    const path = [...pathSoFar];
    const isActive = pathsEqual(path, currentPath);
    const meta = node.record.classification ? CLASSIFICATION_META[node.record.classification] : null;

    mainLineElems.push(
      <span key={path.join(',')} className="inline-flex items-center">
        {node.record.color === 'w' && (
          <span className="text-chess-text-muted text-xs mr-0.5">{node.record.moveNumber}.</span>
        )}
        <button
          ref={isActive ? activeRef : undefined}
          onClick={() => onNavigate(path)}
          className={`px-1.5 py-0.5 rounded transition-colors text-left inline-flex items-center gap-0.5 ${
            isActive ? 'bg-chess-accent text-white font-semibold' : 'text-chess-text-primary hover:bg-chess-surface-hover'
          }`}
        >
          <span>{node.record.san}</span>
          {meta?.symbol && (
            <span className="text-xs font-bold" style={{ color: isActive ? 'white' : meta.color }}>
              {meta.symbol}
            </span>
          )}
        </button>
        {/* If this node has alternatives (variations), render them as indented blocks */}
        {node.children.length > 1 && (
          <span className="inline-block">
            {node.children.slice(1).map((altNode, altIdx) => {
              const altPath = [...pathSoFar, altIdx + 1];
              return (
                <VariationBlock
                  key={altPath.join(',')}
                  startNode={altNode}
                  pathPrefix={altPath}
                  currentPath={currentPath}
                  onNavigate={onNavigate}
                  activeRef={activeRef}
                  depth={depth + 1}
                />
              );
            })}
          </span>
        )}
      </span>
    );

    current = node.children.length > 0 ? [node.children[0]!] : [];
  }

  return (
    <div className={`leading-relaxed ${depth > 0 ? 'border-l-2 border-chess-accent/30 pl-2 ml-1 my-1' : ''}`}>
      {mainLineElems}
    </div>
  );
}

interface VariationBlockProps {
  startNode: MoveNode;
  pathPrefix: number[];
  currentPath: number[];
  onNavigate: (path: number[]) => void;
  activeRef: React.RefObject<HTMLButtonElement>;
  depth: number;
}

function VariationBlock({ startNode, pathPrefix, currentPath, onNavigate, activeRef, depth }: VariationBlockProps) {
  // Build the nodes array starting from startNode
  const nodes: MoveNode[] = [startNode];
  return (
    <div className="border-l-2 border-chess-accent/40 pl-2 ml-1 my-0.5 text-chess-text-secondary">
      <TreeLine
        nodes={nodes}
        pathPrefix={pathPrefix.slice(0, -1)}
        currentPath={currentPath}
        onNavigate={onNavigate}
        activeRef={activeRef}
        depth={depth}
      />
    </div>
  );
}

function pathsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}
