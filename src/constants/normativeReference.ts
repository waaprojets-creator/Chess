// Normative reference for the decisional profile.
//
// With a single-user, local-only dataset, the only *external* population we can
// compare against is the literature. The anchors below are heuristic reference
// distributions {p25, median, p75} per cadence, derived qualitatively from the
// cited studies (Calderwood et al. 1988 on time pressure & tempo; Chase & Simon
// 1973 on tactical chunking; Bilalić et al. 2007 on aggressive vs positional
// style). They are deliberately approximate — once the player has accumulated
// enough comparable games, we switch to their own internal distribution.

export type CadenceCategory = 'bullet' | 'blitz' | 'rapide';

export type MetricKey =
  | 'tempoRegularity'
  | 'openingAsymmetry'
  | 'aggression'
  | 'tacticalSpeed'
  | 'resilience';

export interface Anchor {
  p25: number;
  median: number;
  p75: number;
}

// Comparable games needed before the reference shifts from published anchors to
// the player's own distribution.
export const INTERNAL_MIN = 8;

export const METRIC_LABELS: Record<MetricKey, string> = {
  tempoRegularity: 'Régularité du tempo',
  openingAsymmetry: 'Gestion ouverture / milieu',
  aggression: 'Agressivité',
  tacticalSpeed: 'Vitesse tactique',
  resilience: 'Résilience après erreur',
};

// The trait named by METRIC_LABELS increases when the raw value goes...
//  +1 : up   (higher raw value = more of the trait)
//  -1 : down (lower raw value  = more of the trait)
export const METRIC_ORIENTATION: Record<MetricKey, 1 | -1> = {
  tempoRegularity: -1, // higher CV = less regular
  openingAsymmetry: 1, // higher open/mid ratio = more time invested in the opening
  aggression: 1, // higher share of captures/checks = more aggressive
  tacticalSpeed: -1, // lower tactical/quiet ratio = faster on tactics
  resilience: 1, // higher post-error/baseline ratio = steadier (no collapse)
};

const ANCHORS: Record<MetricKey, Record<CadenceCategory, Anchor>> = {
  // Coefficient of variation of mid-game move times.
  tempoRegularity: {
    bullet: { p25: 0.45, median: 0.7, p75: 1.0 },
    blitz: { p25: 0.55, median: 0.85, p75: 1.2 },
    rapide: { p25: 0.6, median: 0.95, p75: 1.4 },
  },
  // Mean opening move time ÷ mean mid-game move time.
  openingAsymmetry: {
    bullet: { p25: 0.5, median: 0.8, p75: 1.1 },
    blitz: { p25: 0.4, median: 0.65, p75: 1.0 },
    rapide: { p25: 0.35, median: 0.6, p75: 0.95 },
  },
  // Share of player moves that are captures or checks.
  aggression: {
    bullet: { p25: 0.18, median: 0.28, p75: 0.4 },
    blitz: { p25: 0.18, median: 0.28, p75: 0.4 },
    rapide: { p25: 0.16, median: 0.26, p75: 0.38 },
  },
  // Mean capture move time ÷ mean quiet move time.
  tacticalSpeed: {
    bullet: { p25: 0.65, median: 0.95, p75: 1.4 },
    blitz: { p25: 0.6, median: 0.9, p75: 1.3 },
    rapide: { p25: 0.55, median: 0.85, p75: 1.2 },
  },
  // Mean time on the 1-2 moves after an error ÷ median move time.
  resilience: {
    bullet: { p25: 0.5, median: 0.85, p75: 1.4 },
    blitz: { p25: 0.5, median: 0.85, p75: 1.4 },
    rapide: { p25: 0.5, median: 0.85, p75: 1.4 },
  },
};

export function cadenceCategory(minutes: number): CadenceCategory {
  if (minutes < 3) return 'bullet';
  if (minutes < 10) return 'blitz';
  return 'rapide';
}

export const CADENCE_LABEL: Record<CadenceCategory, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapide: 'Rapide',
};

// Position of `value` on the raw-value distribution (0-100), via piecewise-linear
// interpolation through p25→25, median→50, p75→75, clamped to [2, 98].
export function publishedPercentile(key: MetricKey, cad: CadenceCategory, value: number): number {
  const a = ANCHORS[key][cad];
  let p: number;
  if (value <= a.median) {
    const span = a.median - a.p25 || 1;
    p = 25 + ((value - a.p25) / span) * 25;
  } else {
    const span = a.p75 - a.median || 1;
    p = 50 + ((value - a.median) / span) * 25;
  }
  return Math.max(2, Math.min(98, Math.round(p)));
}

// Rank of `value` within the player's own sample (0-100).
export function internalPercentile(value: number, sample: number[]): number {
  if (sample.length === 0) return 50;
  const below = sample.filter((v) => v < value).length;
  return Math.max(2, Math.min(98, Math.round((below / sample.length) * 100)));
}

// Re-orient a raw-distribution percentile so it reads as "intensity of the named trait".
export function orientPercentile(key: MetricKey, rawPercentile: number): number {
  return METRIC_ORIENTATION[key] === 1 ? rawPercentile : 100 - rawPercentile;
}
