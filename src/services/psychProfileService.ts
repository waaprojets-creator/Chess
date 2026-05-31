// Decisional / cognitive profile derived from recorded games.
//
// All metrics are computed from data already stored on each move (timeTakenMs,
// classification, evalCp, SAN) — no extra Stockfish work. Fine metrics that need
// move classification (resilience) are only produced for analyzed games; the rest
// work from tempo alone. Formulations stay strictly factual (observed facts +
// percentiles), never personality verdicts.

import type { SavedGame, MoveRecord, MoveClassification } from '@/types/chess';
import {
  cadenceCategory,
  publishedPercentile,
  internalPercentile,
  orientPercentile,
  METRIC_LABELS,
  CADENCE_LABEL,
  INTERNAL_MIN,
  type MetricKey,
  type CadenceCategory,
} from '@/constants/normativeReference';

export interface DecisionMetric {
  key: MetricKey;
  label: string;
  rawValue: number | null;
  display: string;
  percentile: number | null; // oriented: high = more of the named trait
  trend: number | null; // recent vs older (oriented sign)
  interpretation: string;
  requiresAnalysis: boolean;
  available: boolean;
}

export interface GameReliability {
  reliable: boolean;
  score: number; // 0..1
  reasons: string[];
}

export interface DecisionInsight {
  moveNumber: number;
  tone: 'warn' | 'info' | 'good';
  text: string;
}

export interface PlayerProfile {
  cadenceCategory: CadenceCategory;
  cadenceLabel: string;
  gamesUsed: number;
  gamesExcluded: number;
  referenceMode: 'published' | 'internal';
  metrics: DecisionMetric[];
  hasAnalyzedGames: boolean;
}

const METRIC_ORDER: MetricKey[] = [
  'resilience',
  'tempoRegularity',
  'openingAsymmetry',
  'tacticalSpeed',
  'aggression',
];

// ---- small stats helpers ----
function mean(a: number[]): number {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}
function median(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}
function std(a: number[]): number {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
}

const isCapture = (san: string) => san.includes('x');
const isAggressive = (san: string) => san.includes('x') || san.includes('+') || san.includes('#');
const isError = (c: MoveClassification | null) => c === 'blunder' || c === 'mistake';

// Player moves with a real, recorded deliberation time (legacy games store 0).
function playerMoves(game: SavedGame): MoveRecord[] {
  return game.moves.filter((m) => m.color === game.playerColor && m.timeTakenMs > 0);
}

function fmtSec(ms: number): string {
  const s = ms / 1000;
  return s >= 10 ? `${Math.round(s)} s` : `${s.toFixed(1)} s`;
}

// ---- per-game raw metrics ----
function gameMetrics(game: SavedGame): Record<MetricKey, number | null> {
  const pm = playerMoves(game);
  const times = pm.map((m) => m.timeTakenMs);

  const midTimes = pm.filter((m) => m.moveNumber > 8).map((m) => m.timeTakenMs);
  const tempoRegularity =
    midTimes.length >= 3 && mean(midTimes) > 0 ? std(midTimes) / mean(midTimes) : null;

  const openTimes = pm.filter((m) => m.moveNumber <= 8).map((m) => m.timeTakenMs);
  const asymMid = pm.filter((m) => m.moveNumber > 8 && m.moveNumber <= 25).map((m) => m.timeTakenMs);
  const openingAsymmetry =
    openTimes.length >= 2 && asymMid.length >= 2 && mean(asymMid) > 0
      ? mean(openTimes) / mean(asymMid)
      : null;

  const aggression = pm.length >= 6 ? pm.filter((m) => isAggressive(m.san)).length / pm.length : null;

  const capTimes = pm.filter((m) => isCapture(m.san)).map((m) => m.timeTakenMs);
  const quietTimes = pm.filter((m) => !isCapture(m.san)).map((m) => m.timeTakenMs);
  const tacticalSpeed =
    capTimes.length >= 2 && quietTimes.length >= 2 && mean(quietTimes) > 0
      ? mean(capTimes) / mean(quietTimes)
      : null;

  let resilience: number | null = null;
  if (game.analyzed) {
    const baseline = median(times);
    const afterErr: number[] = [];
    for (let i = 0; i < pm.length; i++) {
      if (isError(pm[i]!.classification)) {
        if (pm[i + 1]) afterErr.push(pm[i + 1]!.timeTakenMs);
        if (pm[i + 2]) afterErr.push(pm[i + 2]!.timeTakenMs);
      }
    }
    if (afterErr.length >= 1 && baseline > 0) resilience = mean(afterErr) / baseline;
  }

  return { tempoRegularity, openingAsymmetry, aggression, tacticalSpeed, resilience };
}

// ---- noise detection (validity scale) ----
export function assessReliability(game: SavedGame): GameReliability {
  const reasons: string[] = [];
  const pm = playerMoves(game);
  const cad = cadenceCategory(game.timeControl.minutes);

  if (pm.length === 0) {
    return {
      reliable: false,
      score: 0,
      reasons: ['Temps de réflexion non enregistré (partie antérieure au suivi)'],
    };
  }
  if (pm.length < 12) reasons.push('Partie trop courte pour être représentative');

  if (pm.length >= 4) {
    const times = pm.map((m) => m.timeTakenMs);
    const avg = mean(times);
    const floor = cad === 'rapide' ? 5000 : cad === 'blitz' ? 2000 : 1000;
    if (avg < floor) reasons.push('Tempo anormalement rapide');
    const cv = avg > 0 ? std(times) / avg : 0;
    if (cv > 1.8) reasons.push('Rythme très erratique (interruptions probables)');
  }

  if (game.analyzed) {
    const errs = pm.filter((m) => isError(m.classification)).length;
    if (errs / pm.length > 0.4) reasons.push("Taux d'erreur extrême");
  }

  return {
    reliable: reasons.length === 0,
    score: Math.max(0, 1 - reasons.length * 0.34),
    reasons,
  };
}

// ---- per-game post-mortem insights ----
export function computeGameInsights(game: SavedGame): DecisionInsight[] {
  const insights: DecisionInsight[] = [];
  const pm = playerMoves(game);
  if (pm.length < 6) return insights;

  const baseline = median(pm.map((m) => m.timeTakenMs));

  if (game.analyzed && baseline > 0) {
    for (let i = 0; i < pm.length; i++) {
      if (!isError(pm[i]!.classification)) continue;
      const nxt = pm[i + 1];
      if (nxt && nxt.timeTakenMs < baseline * 0.4) {
        const kind = pm[i]!.classification === 'blunder' ? 'gaffe' : 'erreur';
        insights.push({
          moveNumber: pm[i]!.moveNumber,
          tone: 'warn',
          text: `Coup ${pm[i]!.moveNumber} : après votre ${kind}, réflexion tombée à ${fmtSec(
            nxt.timeTakenMs
          )} (médiane ${fmtSec(baseline)}) — réaction précipitée.`,
        });
      }
    }
  }

  const m = gameMetrics(game);
  if (m.openingAsymmetry !== null && m.openingAsymmetry < 0.4) {
    insights.push({
      moveNumber: 1,
      tone: 'info',
      text: `Ouverture jouée ${(1 / m.openingAsymmetry).toFixed(1)}× plus vite que le milieu de jeu.`,
    });
  }
  if (m.tacticalSpeed !== null && m.tacticalSpeed < 0.7) {
    insights.push({
      moveNumber: 1,
      tone: 'good',
      text: 'Séquences de captures tranchées rapidement — bonne reconnaissance de motifs.',
    });
  } else if (m.tacticalSpeed !== null && m.tacticalSpeed > 1.5) {
    insights.push({
      moveNumber: 1,
      tone: 'info',
      text: 'Les phases tactiques vous prennent nettement plus de temps que les coups calmes.',
    });
  }

  return insights.slice(0, 6);
}

// ---- interpretation sentences ----
function describe(key: MetricKey, raw: number, oriented: number, internal: boolean): string {
  const ref = internal ? 'de votre historique' : 'vs joueurs comparables';
  const band = oriented <= 35 ? 'low' : oriented >= 66 ? 'high' : 'mid';
  let core: string;
  switch (key) {
    case 'tempoRegularity':
      core =
        band === 'high'
          ? 'Rythme de décision très régulier.'
          : band === 'mid'
          ? 'Rythme de décision modérément régulier.'
          : 'Rythme irrégulier — coups très rapides et longues réflexions alternés.';
      break;
    case 'openingAsymmetry':
      core =
        raw < 0.5
          ? "Vous jouez l'ouverture nettement plus vite que le milieu de jeu."
          : raw > 1
          ? "Vous investissez beaucoup de temps dès l'ouverture."
          : 'Temps équilibré entre ouverture et milieu de jeu.';
      break;
    case 'aggression':
      core =
        band === 'high'
          ? 'Jeu offensif — forte proportion de captures et d\'échecs.'
          : band === 'mid'
          ? 'Équilibre entre attaque et consolidation.'
          : 'Jeu prudent, orienté structure.';
      break;
    case 'tacticalSpeed':
      core =
        band === 'high'
          ? 'Vous tranchez vite les séquences tactiques.'
          : band === 'mid'
          ? 'Vitesse tactique dans la moyenne.'
          : 'Les phases tactiques vous prennent plus de temps que les coups calmes.';
      break;
    case 'resilience':
      core =
        band === 'high'
          ? 'Après une erreur, vous prenez le temps de vous reprendre.'
          : band === 'mid'
          ? 'Réaction mesurée après une erreur.'
          : 'Après une erreur, votre temps de réflexion s\'effondre — réaction impulsive.';
      break;
  }
  return `${core} (${oriented}ᵉ percentile ${ref})`;
}

function formatRaw(key: MetricKey, raw: number): string {
  if (key === 'aggression') return `${Math.round(raw * 100)} %`;
  return raw.toFixed(2);
}

// ---- aggregate profile ----
export function buildProfile(games: SavedGame[]): PlayerProfile {
  // Eligible = not opted out, and not flagged as noise.
  const eligibleAll = games.filter((g) => !g.excludeFromProfile && assessReliability(g).reliable);
  const excluded = games.length - eligibleAll.length;

  // Pick the player's most-played cadence among eligible games.
  const counts: Record<CadenceCategory, number> = { bullet: 0, blitz: 0, rapide: 0 };
  for (const g of eligibleAll) counts[cadenceCategory(g.timeControl.minutes)]++;
  const cad = (Object.keys(counts) as CadenceCategory[]).reduce((a, b) =>
    counts[b] > counts[a] ? b : a
  );

  const comparable = eligibleAll.filter((g) => cadenceCategory(g.timeControl.minutes) === cad);
  const hasAnalyzed = comparable.some((g) => g.analyzed);
  const referenceMode: 'published' | 'internal' =
    comparable.length >= INTERNAL_MIN ? 'internal' : 'published';

  // Per-game raw values (comparable games are newest-first, as loadGames returns).
  const perGame = comparable.map(gameMetrics);

  const metrics: DecisionMetric[] = METRIC_ORDER.map((key) => {
    const values = perGame.map((g) => g[key]).filter((v): v is number => v !== null);
    const requiresAnalysis = key === 'resilience';
    const label = METRIC_LABELS[key];

    if (values.length === 0) {
      return {
        key,
        label,
        rawValue: null,
        display: '—',
        percentile: null,
        trend: null,
        requiresAnalysis,
        available: false,
        interpretation: requiresAnalysis
          ? 'Analysez vos parties pour débloquer cette mesure.'
          : 'Pas encore assez de données.',
      };
    }

    const raw = median(values);
    const internal = referenceMode === 'internal';
    let rawPct: number;
    if (internal) {
      const recent = values.slice(0, Math.min(5, values.length));
      rawPct = internalPercentile(median(recent), values);
    } else {
      rawPct = publishedPercentile(key, cad, raw);
    }
    const oriented = orientPercentile(key, rawPct);

    // Trend: oriented percentile of recent half vs older half.
    let trend: number | null = null;
    if (values.length >= 4) {
      const half = Math.floor(values.length / 2);
      const recent = median(values.slice(0, half));
      const older = median(values.slice(half));
      const rp = orientPercentile(key, publishedPercentile(key, cad, recent));
      const op = orientPercentile(key, publishedPercentile(key, cad, older));
      trend = rp - op;
    }

    return {
      key,
      label,
      rawValue: raw,
      display: formatRaw(key, raw),
      percentile: oriented,
      trend,
      requiresAnalysis,
      available: true,
      interpretation: describe(key, raw, oriented, internal),
    };
  });

  return {
    cadenceCategory: cad,
    cadenceLabel: CADENCE_LABEL[cad],
    gamesUsed: comparable.length,
    gamesExcluded: excluded,
    referenceMode,
    metrics,
    hasAnalyzedGames: hasAnalyzed,
  };
}

// ---- Cognitive context sentence -------------------------------------------

import type { CognitiveSession } from '@/types/chess';

export function buildCognitiveContext(
  session: CognitiveSession,
  profile: PlayerProfile | null
): string | null {
  if (!session.band || !profile) return null;
  const resilience = profile.metrics.find((m) => m.key === 'resilience');
  const tactical   = profile.metrics.find((m) => m.key === 'tacticalSpeed');
  const accuracy   = profile.metrics.find((m) => m.key === 'tempoRegularity');

  const gfHigh = session.band === 'high' || session.band === 'very_high';
  const gfLow  = session.band === 'below_average' || session.band === 'average';

  if (gfHigh && resilience?.available && (resilience.percentile ?? 50) < 35) {
    return 'Capacité de raisonnement fluide élevée — vos chutes de tempo après erreur suggèrent une composante émotionnelle plutôt que cognitive.';
  }
  if (gfHigh && tactical?.available && (tactical.percentile ?? 50) > 65) {
    return 'Forte fluidité — votre rapidité sur les séquences tactiques reflète probablement une bonne reconnaissance des motifs.';
  }
  if (gfLow && tactical?.available && (tactical.percentile ?? 50) > 65) {
    return 'Votre vitesse tactique suggère que l\'expertise acquise compense en partie le raisonnement pur.';
  }
  if (gfHigh && accuracy?.available && (accuracy.percentile ?? 50) < 35) {
    return 'Forte fluidité cognitive, mais le rythme irrégulier suggère un potentiel non encore actualisé sous contrainte.';
  }
  return null;
}
