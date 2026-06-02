export type BoardTheme = 'classic' | 'ocean' | 'carbon';

export const BOARD_THEMES: Record<BoardTheme, { light: string; dark: string; name: string }> = {
  classic: { light: '#f0d9b5', dark: '#b58863', name: 'Classique' },
  ocean:   { light: '#dde6d0', dark: '#6d9ebc', name: 'Océan' },
  carbon:  { light: '#adadad', dark: '#4a4a4a', name: 'Carbone' },
};
