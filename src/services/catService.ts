// IRT 3PL + CAT algorithm — pure functions, no side effects.
//
// References:
//   Lord, F.M. (1980). Applications of item response theory to practical testing problems.
//   van der Linden, W.J. & Glas, C.A.W. (2000). Computerized Adaptive Testing.

import type { CognitiveItem, CognitiveBand } from '@/types/chess';

// ---- IRT 3PL ----------------------------------------------------------------

/** Probability of correct response given latent trait θ and item parameters. */
export function irt3pl(theta: number, a: number, b: number, c: number): number {
  return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
}

/** Fisher information at θ for one item. Higher = more informative at this θ level. */
export function fisherInfo(theta: number, a: number, b: number, c: number): number {
  const p = irt3pl(theta, a, b, c);
  const q = 1 - p;
  if (p <= 0 || q <= 0) return 0;
  const pStar = (p - c) / (1 - c); // probability above guessing floor
  return (a * a * pStar * pStar * q) / p;
}

// ---- θ estimation (Newton-Raphson MLE, bounded ±4) -------------------------

export interface ItemResponse {
  item: CognitiveItem;
  correct: boolean;
}

/** MLE estimate of θ from a list of item responses. Returns 0 for empty input. */
export function estimateTheta(responses: ItemResponse[]): number {
  if (responses.length === 0) return 0;

  // Flat prior prevents divergence on all-correct / all-wrong streaks
  const allCorrect = responses.every((r) => r.correct);
  const allWrong   = responses.every((r) => !r.correct);
  if (allCorrect) return Math.min(4, responses.length * 0.6);
  if (allWrong)   return Math.max(-4, -responses.length * 0.5);

  let theta = 0;
  for (let iter = 0; iter < 40; iter++) {
    let dL = 0;
    let d2L = 0;
    for (const { item, correct } of responses) {
      const { a, b, c } = item.irt;
      const p  = irt3pl(theta, a, b, c);
      const q  = 1 - p;
      const w  = (p - c) / ((1 - c) * p + 1e-9);
      dL  +=  a * w * ((correct ? 1 : 0) - p);
      d2L -= (a * a) * (w * w) * p * q;
    }
    if (Math.abs(d2L) < 1e-9) break;
    const delta = dL / d2L;
    theta = Math.max(-4, Math.min(4, theta - delta));
    if (Math.abs(delta) < 0.001) break;
  }
  return theta;
}

/** Standard error of measurement: 1 / sqrt(total Fisher information). */
export function standardError(theta: number, items: CognitiveItem[]): number {
  const info = items.reduce(
    (sum, item) => sum + fisherInfo(theta, item.irt.a, item.irt.b, item.irt.c),
    0
  );
  return info > 0 ? 1 / Math.sqrt(info) : 99;
}

// ---- Item selection --------------------------------------------------------

/** Pick the unseen item that maximises Fisher information at current θ. */
export function selectNextItem(
  theta: number,
  bank: CognitiveItem[],
  seenIds: Set<string>
): CognitiveItem | null {
  let best: CognitiveItem | null = null;
  let bestInfo = -1;
  for (const item of bank) {
    if (seenIds.has(item.id)) continue;
    const info = fisherInfo(theta, item.irt.a, item.irt.b, item.irt.c);
    if (info > bestInfo) { bestInfo = info; best = item; }
  }
  return best;
}

// ---- Stopping criterion ----------------------------------------------------

const MAX_ITEMS = 15;
const MIN_ITEMS = 10;
const TARGET_SE = 0.35;

export function shouldStop(itemCount: number, se: number): boolean {
  if (itemCount < MIN_ITEMS) return false;
  return itemCount >= MAX_ITEMS || se <= TARGET_SE;
}

// ---- Score interpretation --------------------------------------------------

/** θ → qualitative band. Bands map to approximate normal-distribution percentiles. */
export function thetaToBand(theta: number): CognitiveBand {
  if (theta < -1.0) return 'below_average';  // ~< 16th
  if (theta < 0.0)  return 'average';          // 16th–50th
  if (theta < 0.84) return 'above_average';    // 50th–80th
  if (theta < 1.5)  return 'high';             // 80th–93rd
  return 'very_high';                          // > 93rd
}

/** θ → approximate percentile (standard normal CDF, clamped 2–98). */
export function thetaToPercentile(theta: number): number {
  // Abramowitz & Stegun rational approximation of the standard normal CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(theta));
  const poly = t * (0.319381530
    + t * (-0.356563782
    + t * (1.781477937
    + t * (-1.821255978
    + t * 1.330274429))));
  const phi = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * theta * theta) * poly;
  const cdf = theta >= 0 ? phi : 1 - phi;
  return Math.max(2, Math.min(98, Math.round(cdf * 100)));
}

// ---- QI (échelle Wechsler M=100 SD=15) ------------------------------------

/** θ → QI. Calibré sur les Sandia Matrices (Harris et al., 2020). */
export function thetaToIQ(theta: number): number {
  return Math.round(100 + 15 * theta);
}

/** IC 95 % du QI à partir de l'erreur standard de mesure en θ. */
export function iqConfidenceInterval(theta: number, se: number): [number, number] {
  const iq     = thetaToIQ(theta);
  const margin = Math.round(1.96 * 15 * se);
  return [iq - margin, iq + margin];
}

export const BAND_LABELS: Record<CognitiveBand, string> = {
  below_average: 'En dessous de la moyenne',
  average:       'Dans la moyenne',
  above_average: 'Au-dessus de la moyenne',
  high:          'Élevé',
  very_high:     'Très élevé',
};

export const BAND_COLORS: Record<CognitiveBand, string> = {
  below_average: '#cc3232',
  average:       '#a0a0a0',
  above_average: '#f0c15c',
  high:          '#97b172',
  very_high:     '#1baca6',
};
