import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadGames } from '@/services/gameStorageService';
import { buildProfile, buildCognitiveContext, type DecisionMetric } from '@/services/psychProfileService';
import { useCognitiveTestStore } from '@/store/cognitiveTestStore';
import { BAND_LABELS, BAND_COLORS } from '@/services/catService';
import { Button } from '@/components/ui/Button';

function trendIcon(trend: number | null): { icon: string; color: string } | null {
  if (trend === null) return null;
  if (trend > 4) return { icon: '↑', color: 'text-chess-win' };
  if (trend < -4) return { icon: '↓', color: 'text-chess-loss' };
  return { icon: '→', color: 'text-chess-text-muted' };
}

function pctColor(p: number): string {
  return p >= 66 ? '#97b172' : p >= 35 ? '#f0c15c' : '#cc3232';
}

function MetricCard({ metric }: { metric: DecisionMetric }) {
  if (!metric.available || metric.percentile === null) {
    return (
      <div className="rounded-2xl border border-chess-border/50 bg-chess-surface p-4 opacity-60">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-chess-text-secondary">{metric.label}</span>
          <span className="text-xs text-chess-text-muted">—</span>
        </div>
        <p className="mt-1 text-xs text-chess-text-muted">{metric.interpretation}</p>
      </div>
    );
  }

  const p = metric.percentile;
  const color = pctColor(p);
  const trend = trendIcon(metric.trend);

  return (
    <div className="rounded-2xl border border-chess-border/50 bg-chess-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-chess-text-primary">{metric.label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-black" style={{ color }}>
            {p}
            <span className="text-xs font-semibold text-chess-text-muted">ᵉ</span>
          </span>
          {trend && <span className={`text-sm ${trend.color}`}>{trend.icon}</span>}
        </div>
      </div>
      {/* Percentile bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-chess-border/40">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, backgroundColor: color }} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-chess-text-secondary">{metric.interpretation}</p>
    </div>
  );
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const profile = useMemo(() => buildProfile(loadGames()), []);
  const cogSessions = useCognitiveTestStore((s) => s.sessions);
  const latestCog = cogSessions[0] ?? null;
  const cogContext = buildCognitiveContext(latestCog!, profile) ?? null;

  const hasData = profile.gamesUsed > 0 && profile.metrics.some((m) => m.available);

  return (
    <div className="screen-enter mx-auto max-w-lg space-y-4 px-4 pt-safe">
      <div className="flex items-center justify-between pt-6">
        <h1 className="text-2xl font-black tracking-tight text-chess-text-primary">
          Profil <span className="text-base font-semibold text-chess-text-muted">décisionnel</span>
        </h1>
        <Button size="sm" variant="ghost" onClick={() => navigate('/history')}>
          Parties
        </Button>
      </div>

      {/* Cognitive section */}
      {latestCog?.band && latestCog.percentile !== null ? (
        <div className="rounded-2xl border border-chess-border/50 bg-chess-surface p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-chess-text-secondary">Cognition (Gf)</span>
            <Button size="sm" variant="ghost" onClick={() => navigate('/cognitive')}>Retester</Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 shrink-0">
              <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle cx="20" cy="20" r="16" fill="none"
                  stroke={BAND_COLORS[latestCog.band]}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(latestCog.percentile / 100) * 100.53} 100.53`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
                style={{ color: BAND_COLORS[latestCog.band] }}>
                {latestCog.percentile}ᵉ
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-chess-text-primary">
                {BAND_LABELS[latestCog.band]}
                {(latestCog.iq ?? latestCog.thetaFinal != null) && (
                  <span className="ml-2 text-xs font-semibold text-chess-text-muted">
                    QI ≈ {latestCog.iq ?? Math.round(100 + 15 * (latestCog.thetaFinal ?? 0))}
                  </span>
                )}
              </div>
              {cogContext && (
                <p className="text-xs text-chess-text-muted mt-0.5 leading-relaxed">{cogContext}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => navigate('/cognitive')}
          className="w-full rounded-2xl border border-dashed border-chess-border/60 bg-chess-surface/40 px-4 py-4 text-left hover:border-chess-accent/40 transition-colors"
        >
          <div className="text-sm font-semibold text-chess-text-secondary">🧠 Tester votre raisonnement fluide</div>
          <div className="text-xs text-chess-text-muted mt-0.5">Test adaptatif · ~5 min · Matrices progressives</div>
        </button>
      )}

      {!hasData ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-chess-border bg-chess-surface/40 px-6 py-14 text-center text-chess-text-muted">
          <span className="text-5xl">🧠</span>
          <p className="text-sm font-medium text-chess-text-secondary">Profil pas encore disponible</p>
          <p className="text-xs">
            Jouez quelques parties{profile.gamesUsed > 0 ? ` en ${profile.cadenceLabel}` : ''} puis
            analysez-les pour révéler vos tendances décisionnelles. Le temps de réflexion n'est
            mesuré que depuis la mise à jour du suivi.
          </p>
          <Button onClick={() => navigate('/play')}>Jouer une partie</Button>
        </div>
      ) : (
        <>
          {/* Honesty banner */}
          <div className="rounded-2xl border border-chess-border/40 bg-chess-surface px-4 py-3 text-xs text-chess-text-muted">
            <p>
              Basé sur <span className="font-semibold text-chess-text-secondary">{profile.gamesUsed}</span>{' '}
              partie{profile.gamesUsed > 1 ? 's' : ''} en{' '}
              <span className="font-semibold text-chess-text-secondary">{profile.cadenceLabel}</span>
              {profile.gamesExcluded > 0 && ` · ${profile.gamesExcluded} écartée(s)`}.
            </p>
            <p className="mt-0.5">
              Référence :{' '}
              {profile.referenceMode === 'internal'
                ? 'votre historique personnel'
                : 'repères de la littérature (en attendant assez de parties)'}
              .
            </p>
          </div>

          <div className="space-y-2.5">
            {profile.metrics.map((m) => (
              <MetricCard key={m.key} metric={m} />
            ))}
          </div>

          {!profile.hasAnalyzedGames && (
            <p className="px-1 text-[11px] text-chess-text-muted">
              Certaines mesures (résilience après erreur) nécessitent d'analyser vos parties.
            </p>
          )}

          <p className="px-1 pb-2 text-[11px] leading-relaxed text-chess-text-muted">
            Ces mesures décrivent vos habitudes de décision aux échecs, situées sur un spectre de
            joueurs comparables. Elles ne constituent pas un diagnostic psychologique.
          </p>
        </>
      )}
    </div>
  );
}
