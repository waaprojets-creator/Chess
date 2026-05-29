import { useNavigate } from 'react-router-dom';
import { getStats, loadGames } from '@/services/gameStorageService';
import { usePuzzleStore } from '@/store/puzzleStore';

export default function HomeScreen() {
  const navigate = useNavigate();
  const stats = getStats();
  const recentGames = loadGames().slice(0, 4);
  const puzzleRating = usePuzzleStore((s) => s.playerRating);

  const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;

  return (
    <div className="screen-enter mx-auto max-w-lg px-4 pt-safe">
      {/* Hero */}
      <header className="pt-7 pb-5">
        <p className="text-sm font-medium text-chess-text-muted">Bienvenue 👋</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-black tracking-tight text-chess-text-primary">
          <span className="text-chess-accent-light drop-shadow-[0_0_12px_rgba(143,184,110,0.45)]">♟</span>
          Chess
        </h1>
        <p className="mt-1 text-sm text-chess-text-secondary">Jouez · Analysez · Progressez</p>
      </header>

      {/* Primary play CTA */}
      <button
        onClick={() => navigate('/play')}
        className="group relative w-full overflow-hidden rounded-3xl bg-accent-gradient p-5 text-left shadow-glow transition-transform duration-150 active:scale-[0.99]"
      >
        <div className="absolute -right-6 -top-8 text-[120px] leading-none text-white/10 transition-transform duration-300 group-hover:scale-110">
          ♞
        </div>
        <div className="relative">
          <div className="text-lg font-bold text-white">Jouer une partie</div>
          <div className="mt-0.5 text-sm text-white/80">Affrontez l'IA Stockfish · 400–3000 Elo</div>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-white">
            Commencer →
          </div>
        </div>
      </button>

      {/* Quick actions */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <ActionCard
          icon="⚡"
          title="Puzzles"
          subtitle={`Classement ${puzzleRating}`}
          accent="#f0c15c"
          onClick={() => navigate('/puzzles')}
        />
        <ActionCard
          icon="📈"
          title="Analyser"
          subtitle={recentGames.length ? 'Votre dernière partie' : 'Après une partie'}
          accent="#5c8bb0"
          onClick={() =>
            recentGames[0]
              ? navigate(`/analysis?gameId=${recentGames[0].id}`)
              : navigate('/history')
          }
        />
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <StatCard label="Parties" value={stats.total} />
        <StatCard label="Victoires" value={`${winRate}%`} color="#8fb86e" />
        <StatCard label="Puzzles" value={puzzleRating} color="#f0c15c" />
      </div>

      {/* Win/Loss breakdown */}
      {stats.total > 0 && (
        <section className="mt-3 rounded-2xl border border-chess-border/60 bg-surface-gradient p-4 shadow-card">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-chess-text-secondary">Bilan</h2>
          <div className="mt-3 flex gap-3">
            <ResultBar label="Victoires" count={stats.wins} total={stats.total} color="#8fb86e" />
            <ResultBar label="Nulles" count={stats.draws} total={stats.total} color="#a0a0a0" />
            <ResultBar label="Défaites" count={stats.losses} total={stats.total} color="#cc3232" />
          </div>
        </section>
      )}

      {/* Recent games OR first-time hint */}
      {recentGames.length > 0 ? (
        <section className="mt-3 rounded-2xl border border-chess-border/60 bg-surface-gradient p-4 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-chess-text-secondary">Dernières parties</h2>
            <button onClick={() => navigate('/history')} className="text-xs font-semibold text-chess-accent-light hover:underline">
              Voir tout
            </button>
          </div>
          <div className="mt-2 divide-y divide-chess-border/40">
            {recentGames.map((g) => {
              const playerWon =
                (g.result === 'white' && g.playerColor === 'w') ||
                (g.result === 'black' && g.playerColor === 'b');
              const playerLost =
                (g.result === 'white' && g.playerColor === 'b') ||
                (g.result === 'black' && g.playerColor === 'w');
              const dot = playerWon ? 'bg-chess-win' : playerLost ? 'bg-chess-loss' : 'bg-chess-draw';

              return (
                <button
                  key={g.id}
                  className="flex w-full items-center justify-between py-2.5 text-left transition-colors hover:bg-chess-surface-alt/40"
                  onClick={() => navigate(`/analysis?gameId=${g.id}`)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                    <span className="text-sm text-chess-text-primary">vs Bot {g.botElo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-chess-text-muted">
                    <span>{g.timeControl.label}</span>
                    <span>{new Date(g.startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mt-3 rounded-2xl border border-dashed border-chess-border bg-chess-surface/40 p-5 text-center">
          <div className="text-3xl">🎯</div>
          <p className="mt-2 text-sm font-medium text-chess-text-secondary">Aucune partie pour l'instant</p>
          <p className="mt-0.5 text-xs text-chess-text-muted">
            Lancez votre première partie ou échauffez-vous avec un puzzle.
          </p>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="rounded-2xl border border-chess-border/60 bg-surface-gradient p-3 text-center shadow-card">
      <div className="text-2xl font-black" style={{ color: color ?? '#e8e6e3' }}>{value}</div>
      <div className="mt-0.5 text-[11px] font-medium text-chess-text-muted">{label}</div>
    </div>
  );
}

function ActionCard({
  icon, title, subtitle, accent, onClick,
}: { icon: string; title: string; subtitle: string; accent: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-chess-border/60 bg-surface-gradient p-4 text-left shadow-card transition-all duration-150 hover:border-chess-accent/40 active:scale-[0.98]"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: `${accent}22`, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-chess-text-primary">{title}</div>
        <div className="truncate text-xs text-chess-text-muted">{subtitle}</div>
      </div>
    </button>
  );
}

function ResultBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex-1 text-center">
      <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-chess-surface-alt">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="text-sm font-bold" style={{ color }}>{count}</div>
      <div className="text-[10px] text-chess-text-muted">{label}</div>
    </div>
  );
}
