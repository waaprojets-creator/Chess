import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/Button';
import { TIME_CONTROLS } from '@/constants/timeControls';
import { BOT_PROFILES, ELO_MIN, ELO_MAX } from '@/constants/elo';
import type { PieceColor, TimeControl, EngineMode } from '@/types/chess';

type Opponent = 'bot' | 'human';

export default function PlaySetupScreen() {
  const navigate = useNavigate();
  const startGame = useGameStore((s) => s.startGame);

  const [opponent, setOpponent] = useState<Opponent>('bot');
  const [color, setColor] = useState<PieceColor | 'random'>('white' as unknown as PieceColor);
  const [elo, setElo] = useState(1200);
  const [tc, setTc] = useState<TimeControl>(TIME_CONTROLS[6]!);
  const [engineMode, setEngineMode] = useState<EngineMode>('stockfish');

  const nearestProfile = BOT_PROFILES.reduce((p, c) =>
    Math.abs(c.elo - elo) < Math.abs(p.elo - elo) ? c : p
  );

  function handleStart() {
    let chosenColor: PieceColor;
    if (color === 'random' as unknown as PieceColor) {
      chosenColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      chosenColor = color === ('white' as unknown as PieceColor) ? 'w' : 'b';
    }
    const vsHuman = opponent === 'human';
    startGame(chosenColor, vsHuman ? 0 : elo, tc, vsHuman, vsHuman ? 'stockfish' : engineMode);
    navigate('/game');
  }

  return (
    <div className="screen-enter mx-auto max-w-lg space-y-7 px-4 pt-safe">
      <h1 className="pt-6 text-2xl font-black tracking-tight text-chess-text-primary">Nouvelle partie</h1>

      {/* Opponent selection */}
      <section className="space-y-2.5">
        <label className="text-sm font-semibold text-chess-text-secondary">Adversaire</label>
        <div className="grid grid-cols-2 gap-2.5">
          {(['bot', 'human'] as const).map((o) => {
            const selected = opponent === o;
            return (
              <button
                key={o}
                onClick={() => setOpponent(o)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.97]
                  ${selected
                    ? 'border-chess-accent bg-chess-accent/15 text-chess-accent-light shadow-glow'
                    : 'border-chess-border bg-surface-gradient text-chess-text-secondary hover:border-chess-accent/50'}
                `}
              >
                <span className="text-xl">{o === 'bot' ? '🤖' : '👤'}</span>
                <span>{o === 'bot' ? 'Contre le bot' : 'Contre un ami'}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Color selection */}
      <section className="space-y-2.5">
        <label className="text-sm font-semibold text-chess-text-secondary">Couleur</label>
        <div className="grid grid-cols-3 gap-2.5">
          {(['white', 'random', 'black'] as const).map((c) => {
            const selected = color === (c as unknown as PieceColor);
            return (
              <button
                key={c}
                onClick={() => setColor(c as unknown as PieceColor)}
                className={`flex flex-col items-center gap-1 rounded-2xl border py-3.5 text-sm font-semibold transition-all duration-150 active:scale-[0.97]
                  ${selected
                    ? 'border-chess-accent bg-chess-accent/15 text-chess-accent-light shadow-glow'
                    : 'border-chess-border bg-surface-gradient text-chess-text-secondary hover:border-chess-accent/50'}
                `}
              >
                <span className="text-2xl leading-none">
                  {c === 'white' ? '♔' : c === 'black' ? '♚' : '🎲'}
                </span>
                {c === 'white' ? 'Blanc' : c === 'black' ? 'Noir' : 'Aléat.'}
              </button>
            );
          })}
        </div>
      </section>

      {/* Bot options — only when playing vs bot */}
      {opponent === 'bot' && (
        <>
          {/* ELO Slider */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-chess-text-secondary">Niveau du bot</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-chess-text-primary">{elo}</span>
                <span className="rounded-full bg-chess-accent/15 px-2.5 py-0.5 text-xs font-semibold text-chess-accent-light">
                  {nearestProfile.label}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={ELO_MIN}
              max={ELO_MAX}
              step={50}
              value={elo}
              onChange={(e) => setElo(parseInt(e.target.value))}
              className="range-accent w-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-chess-text-muted">
              <span>400</span>
              <span>1200</span>
              <span>2000</span>
              <span>3000</span>
            </div>
          </section>

          {/* Engine mode */}
          <section className="space-y-2.5">
            <label className="text-sm font-semibold text-chess-text-secondary">Style de jeu</label>
            <div className="grid grid-cols-2 gap-2.5">
              {([
                { mode: 'stockfish' as EngineMode, icon: '⚙', label: 'Stockfish', desc: 'Force brute calibrée' },
                { mode: 'human' as EngineMode, icon: '🧠', label: 'Style humain', desc: 'Erreurs naturelles' },
              ]).map(({ mode, icon, label, desc }) => {
                const selected = engineMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setEngineMode(mode)}
                    className={`flex flex-col gap-0.5 rounded-2xl border px-3.5 py-3 text-left transition-all duration-150 active:scale-[0.98]
                      ${selected
                        ? 'border-chess-accent bg-chess-accent/15 shadow-glow'
                        : 'border-chess-border bg-surface-gradient hover:border-chess-accent/50'}
                    `}
                  >
                    <span className="text-lg">{icon}</span>
                    <span className={`text-sm font-bold ${selected ? 'text-chess-accent-light' : 'text-chess-text-primary'}`}>{label}</span>
                    <span className={`text-xs ${selected ? 'text-chess-accent-light/70' : 'text-chess-text-muted'}`}>{desc}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Time control */}
      <section className="space-y-2.5">
        <label className="text-sm font-semibold text-chess-text-secondary">Cadence</label>
        <div className="grid grid-cols-2 gap-2.5">
          {TIME_CONTROLS.map((t) => {
            const selected = tc.label === t.label;
            const [cat, ...rest] = t.label.split(' ');
            return (
              <button
                key={t.label}
                onClick={() => setTc(t)}
                className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition-all duration-150 active:scale-[0.98]
                  ${selected
                    ? 'border-chess-accent bg-chess-accent/15 shadow-glow'
                    : 'border-chess-border bg-surface-gradient hover:border-chess-accent/50'}
                `}
              >
                <span className={`text-xs font-medium ${selected ? 'text-chess-accent-light' : 'text-chess-text-muted'}`}>
                  {cat}
                </span>
                <span className={`text-sm font-bold ${selected ? 'text-chess-accent-light' : 'text-chess-text-primary'}`}>
                  {rest.join(' ')}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <Button fullWidth size="lg" onClick={handleStart}>
        Lancer la partie
      </Button>
    </div>
  );
}
