import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardTheme } from '@/constants/boardThemes';

interface SettingsStore {
  boardTheme: BoardTheme;
  soundEnabled: boolean;
  setBoardTheme: (theme: BoardTheme) => void;
  toggleSound: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      boardTheme: 'classic',
      soundEnabled: true,
      setBoardTheme: (boardTheme) => set({ boardTheme }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    { name: 'chess:settings' }
  )
);
