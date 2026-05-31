import { useNavigate } from 'react-router-dom';
import { useCognitiveTestStore } from '@/store/cognitiveTestStore';
import { MatrixGrid } from '@/components/cognitive/MatrixGrid';
import { MatrixCellView } from '@/components/cognitive/MatrixCell';
import { Button } from '@/components/ui/Button';
import { BAND_LABELS, BAND_COLORS } from '@/services/catService';
import type { CognitiveBand } from '@/types/chess';

const MAX_ITEMS = 15;

function BandGauge({ band, percentile }: { band: CognitiveBand; percentile: number }) {
  const color = BAND_COLORS[band];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle
            cx="20" cy="20" r="16"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(percentile / 100) * 100.53} 100.53`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-black" style={{ color }}>
          {percentile}
          <span className="text-[10px] font-semibold">ᵉ</span>
        </span>
      </div>
      <span className="text-sm font-bold text-chess-text-primary text-center">{BAND_LABELS[band]}</span>
      <span className="text-xs text-chess-text-muted">percentile indicatif</span>
    </div>
  );
}

export default function CognitiveTestScreen() {
  const navigate = useNavigate();
  const store = useCognitiveTestStore();
  const latestSession = store.sessions[0] ?? null;

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (store.phase === 'idle') {
    return (
      <div className="screen-enter mx-auto max-w-lg space-y-5 px-4 pt-safe">
        <div className="pt-6">
          <h1 className="text-2xl font-black tracking-tight text-chess-text-primary">Test cognitif</h1>
          <p className="mt-1 text-sm text-chess-text-muted">Intelligence fluide — Matrices progressives</p>
        </div>

        <div className="rounded-2xl border border-chess-border/50 bg-chess-surface p-5 space-y-3">
          <div className="flex gap-3 text-sm text-chess-text-secondary">
            <span className="flex items-center gap-1.5">⏱ ~5 min</span>
            <span className="flex items-center gap-1.5">📊 10–15 questions</span>
            <span className="flex items-center gap-1.5">🎯 Adaptatif</span>
          </div>
          <p className="text-xs text-chess-text-muted leading-relaxed">
            Chaque question affiche une grille 3×3 avec une case manquante. Identifiez la règle
            logique et choisissez la case qui complète le motif.
          </p>
          <p className="text-[11px] text-chess-text-muted border-t border-chess-border/30 pt-3">
            Résultat indicatif uniquement — pas un test psychométrique clinique certifié.
          </p>
        </div>

        {latestSession?.band && latestSession.percentile !== null && (
          <div className="rounded-2xl border border-chess-border/40 bg-chess-surface p-4 flex items-center gap-4">
            <div className="relative w-12 h-12 shrink-0">
              <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="20" cy="20" r="16" fill="none"
                  stroke={BAND_COLORS[latestSession.band]}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(latestSession.percentile / 100) * 100.53} 100.53`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
                style={{ color: BAND_COLORS[latestSession.band] }}>
                {latestSession.percentile}ᵉ
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-chess-text-primary">{BAND_LABELS[latestSession.band]}</div>
              <div className="text-xs text-chess-text-muted">
                Dernier test · {new Date(latestSession.startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
        )}

        <Button fullWidth size="lg" onClick={() => store.startTest()}>
          Commencer le test
        </Button>
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (store.phase === 'done') {
    const session = store.sessions[0];
    if (!session?.band || session.percentile === null) {
      return null;
    }
    const color = BAND_COLORS[session.band];

    return (
      <div className="screen-enter mx-auto max-w-lg space-y-5 px-4 pt-safe">
        <div className="pt-6">
          <h1 className="text-2xl font-black tracking-tight text-chess-text-primary">Résultat</h1>
        </div>

        <div className="rounded-3xl border border-chess-border/50 bg-chess-surface p-6 flex flex-col items-center gap-4">
          <BandGauge band={session.band} percentile={session.percentile} />
          <p className="text-xs text-chess-text-muted text-center max-w-[260px] leading-relaxed">
            Basé sur {session.itemCount} questions adaptatives. Ce score reflète votre
            raisonnement fluide dans ce contexte — résultat indicatif, non clinique.
          </p>
        </div>

        {store.sessions.length > 1 && (
          <div className="rounded-2xl border border-chess-border/40 bg-chess-surface p-4 space-y-2">
            <div className="text-xs font-semibold text-chess-text-secondary">Historique</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {store.sessions.slice(0, 8).map((s, i) => {
                if (!s.band || s.percentile === null) return null;
                const c2 = BAND_COLORS[s.band];
                return (
                  <div key={s.id} className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                      style={{ borderColor: c2, color: c2 }}>
                      {s.percentile}
                    </div>
                    <div className="text-[9px] text-chess-text-muted">
                      {i === 0 ? 'Auj.' : new Date(s.startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" fullWidth onClick={() => navigate('/profile')}>
            Voir mon profil
          </Button>
          <Button size="sm" fullWidth onClick={() => store.startTest()}>
            Retester
          </Button>
        </div>
      </div>
    );
  }

  // ── TESTING / FEEDBACK ────────────────────────────────────────────────────
  const { currentItem, responses, selectedOptionIndex, phase, lastAnswerCorrect } = store;
  if (!currentItem) return null;

  const progress = responses.length;
  const isFeedback = phase === 'feedback';

  return (
    <div className="screen-enter mx-auto max-w-lg space-y-5 px-4 pt-safe">
      {/* Progress bar */}
      <div className="pt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-chess-text-muted">
          <span>Question {progress + (isFeedback ? 0 : 1)} / {MAX_ITEMS}</span>
          <span>{currentItem.domain}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-chess-border/40">
          <div
            className="h-full rounded-full bg-chess-accent transition-all duration-500"
            style={{ width: `${((progress) / MAX_ITEMS) * 100}%` }}
          />
        </div>
      </div>

      {/* Matrix */}
      <div className="flex justify-center">
        <MatrixGrid grid={currentItem.grid} cellSize={60} />
      </div>

      {/* Feedback message */}
      {isFeedback && (
        <div className={`text-center text-sm font-semibold rounded-xl px-3 py-2 ${
          lastAnswerCorrect
            ? 'bg-[#1baca620] text-[#1baca6]'
            : 'bg-chess-blunder/10 text-chess-blunder'
        }`}>
          {lastAnswerCorrect ? '✓ Correct' : '✗ Incorrect — la bonne réponse est mise en évidence'}
        </div>
      )}

      {/* Options grid */}
      <div className="grid grid-cols-5 gap-2 justify-items-center">
        {currentItem.options.map((opt, i) => {
          let highlight: 'correct' | 'wrong' | undefined;
          if (isFeedback) {
            if (i === currentItem.correctIndex) highlight = 'correct';
            else if (i === selectedOptionIndex && !lastAnswerCorrect) highlight = 'wrong';
          }
          return (
            <MatrixCellView
              key={i}
              cell={opt}
              cellSize={52}
              selected={!isFeedback && selectedOptionIndex === i}
              highlight={highlight}
              onClick={isFeedback ? undefined : () => store.selectOption(i)}
            />
          );
        })}
      </div>

      {/* Action button */}
      {isFeedback ? (
        <Button fullWidth onClick={() => store.nextItem()}>
          Suivant →
        </Button>
      ) : (
        <Button
          fullWidth
          disabled={selectedOptionIndex === null}
          onClick={() => store.submitAnswer()}
        >
          Valider
        </Button>
      )}
    </div>
  );
}
