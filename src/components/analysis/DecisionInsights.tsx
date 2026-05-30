import { computeGameInsights } from '@/services/psychProfileService';
import type { SavedGame } from '@/types/chess';

const TONE: Record<string, { dot: string; text: string }> = {
  warn: { dot: 'bg-chess-mistake', text: 'text-chess-text-secondary' },
  info: { dot: 'bg-chess-accent', text: 'text-chess-text-secondary' },
  good: { dot: 'bg-chess-win', text: 'text-chess-text-secondary' },
};

export function DecisionInsights({ game }: { game: SavedGame }) {
  const insights = computeGameInsights(game);
  if (insights.length === 0) return null;

  return (
    <div className="bg-chess-surface rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">🧠</span>
        <span className="text-sm font-semibold text-chess-text-secondary">Lecture décisionnelle</span>
      </div>
      <ul className="space-y-2">
        {insights.map((ins, i) => {
          const tone = TONE[ins.tone] ?? TONE.info!;
          return (
            <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed">
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
              <span className={tone.text}>{ins.text}</span>
            </li>
          );
        })}
      </ul>
      {!game.analyzed && (
        <p className="text-[11px] text-chess-text-muted">
          Analysez la partie pour débloquer la résilience après erreur.
        </p>
      )}
    </div>
  );
}
