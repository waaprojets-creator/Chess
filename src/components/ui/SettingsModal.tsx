import { useSettingsStore } from '@/store/settingsStore';
import { BOARD_THEMES, type BoardTheme } from '@/constants/boardThemes';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { boardTheme, soundEnabled, setBoardTheme, toggleSound } = useSettingsStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl bg-chess-surface border border-chess-border/50 p-6 space-y-5 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-chess-text-muted hover:text-chess-text-primary text-lg leading-none"
          aria-label="Fermer"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-chess-text-primary">Paramètres</h2>

        {/* Board themes */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-chess-text-secondary">Thème du plateau</p>
          <div className="flex gap-3">
            {(Object.entries(BOARD_THEMES) as [BoardTheme, (typeof BOARD_THEMES)[BoardTheme]][]).map(
              ([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setBoardTheme(key)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-colors
                    ${boardTheme === key
                      ? 'border-chess-accent bg-chess-accent/10'
                      : 'border-chess-border/50 hover:border-chess-border'}`}
                >
                  <div className="flex rounded overflow-hidden shadow-sm">
                    <div className="w-5 h-5" style={{ background: theme.light }} />
                    <div className="w-5 h-5" style={{ background: theme.dark }} />
                  </div>
                  <span className="text-xs text-chess-text-muted">{theme.name}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Sound toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-chess-text-secondary">Sons</span>
          <button
            onClick={toggleSound}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              soundEnabled ? 'bg-chess-accent' : 'bg-chess-surface-alt'
            }`}
            role="switch"
            aria-checked={soundEnabled}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
