import type { MoveClassification } from '@/types/chess';

// Centipawn-loss boundaries (cp loss from the moving player's perspective).
// An inaccuracy starts ~0.5 pawn, a mistake ~1 pawn, a blunder ~3 pawns — in
// line with common engine-review tools, so a single imperfect move is no
// longer flagged as a "Gaffe".
export const CLASSIFICATION_THRESHOLDS = {
  good: 50,
  inaccuracy: 100,
  mistake: 300,
  blunder: Infinity,
} as const;

export const CLASSIFICATION_META: Record<
  MoveClassification,
  { symbol: string; label: string; color: string; bgColor: string }
> = {
  brilliant: { symbol: '!!', label: 'Brillant',    color: '#1baca6', bgColor: 'rgba(27,172,166,0.2)' },
  great:     { symbol: '!',  label: 'Excellent',   color: '#5c8bb0', bgColor: 'rgba(92,139,176,0.2)' },
  best:      { symbol: '★',  label: 'Meilleur',    color: '#97b172', bgColor: 'rgba(151,177,114,0.2)' },
  good:      { symbol: '',   label: 'Bon',          color: '#97b172', bgColor: 'rgba(151,177,114,0.15)' },
  forced:    { symbol: '',   label: 'Forcé',        color: '#a0a0a0', bgColor: 'rgba(160,160,160,0.15)' },
  book:      { symbol: '',   label: 'Théorie',      color: '#c9a227', bgColor: 'rgba(201,162,39,0.15)' },
  inaccuracy:{ symbol: '?!', label: 'Imprécision', color: '#f0c15c', bgColor: 'rgba(240,193,92,0.2)' },
  mistake:   { symbol: '?',  label: 'Erreur',       color: '#e07c2a', bgColor: 'rgba(224,124,42,0.2)' },
  blunder:   { symbol: '??', label: 'Gaffe',        color: '#cc3232', bgColor: 'rgba(204,50,50,0.2)' },
};

export function classifyMove(
  cpBefore: number,
  cpAfter: number,
  playedUci: string,
  bestUci: string,
  isBrilliant = false
): MoveClassification {
  const cpLoss = cpBefore - cpAfter;

  if (isBrilliant && playedUci === bestUci) return 'brilliant';
  if (playedUci === bestUci) return cpLoss <= 0 ? 'best' : 'great';
  // A non-engine move that loses nothing is solid, but not "Excellent".
  if (cpLoss <= 0) return 'good';
  if (cpLoss <= CLASSIFICATION_THRESHOLDS.good) return 'good';
  if (cpLoss <= CLASSIFICATION_THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (cpLoss <= CLASSIFICATION_THRESHOLDS.mistake) return 'mistake';
  return 'blunder';
}

export function cpToPercent(cp: number): number {
  const clamped = Math.max(-1500, Math.min(1500, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clamped)) - 1);
}

export function scoreToPercent(
  evalCp: number | null,
  evalMate: number | null
): number {
  if (evalMate !== null) {
    return evalMate > 0 ? 99 : 1;
  }
  if (evalCp !== null) return cpToPercent(evalCp);
  return 50;
}
