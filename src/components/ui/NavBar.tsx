import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SettingsModal } from './SettingsModal';

const NAV = [
  { to: '/',        icon: '♞', label: 'Accueil'  },
  { to: '/play',    icon: '♟', label: 'Jouer'    },
  { to: '/puzzles', icon: '⚡', label: 'Puzzles'  },
  { to: '/history', icon: '🗂', label: 'Parties'  },
];

export default function NavBar() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <nav className="fixed bottom-0 left-0 right-0 nav-h pb-safe glass border-t border-chess-border/70 flex items-stretch z-40">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150 ` +
              (isActive
                ? 'text-chess-accent-light'
                : 'text-chess-text-muted hover:text-chess-text-secondary')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center w-11 h-7 rounded-full text-lg leading-none transition-all duration-200 ${
                    isActive ? 'bg-chess-accent/15' : ''
                  }`}
                >
                  {icon}
                </span>
                <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-chess-text-muted hover:text-chess-text-secondary transition-colors duration-150"
        >
          <span className="flex items-center justify-center w-11 h-7 rounded-full text-lg leading-none">
            ⚙
          </span>
          <span className="text-[10px] font-semibold tracking-wide">Réglages</span>
        </button>
      </nav>
    </>
  );
}
