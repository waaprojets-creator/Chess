/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        chess: {
          bg: '#1a1a1a',
          surface: '#262421',
          'surface-alt': '#302e2b',
          'surface-hover': '#3d3a37',
          border: '#3d3a37',
          'board-light': '#f0d9b5',
          'board-dark': '#b58863',
          'board-light-active': '#cdd26a',
          'board-dark-active': '#aaa23a',
          'board-light-check': '#e8665b',
          'board-dark-check': '#d32f2f',
          accent: '#769656',
          'accent-hover': '#5e7d3a',
          'accent-light': '#8fb86e',
          'text-primary': '#e8e6e3',
          'text-secondary': '#a0a0a0',
          'text-muted': '#6e6e6e',
          'eval-white': '#f0f0f0',
          'eval-black': '#1a1a1a',
          brilliant: '#1baca6',
          great: '#5c8bb0',
          best: '#97b172',
          good: '#97b172',
          inaccuracy: '#f0c15c',
          mistake: '#e07c2a',
          blunder: '#cc3232',
          'clock-low': '#cc3232',
          'clock-warning': '#e07c2a',
          win: '#769656',
          loss: '#cc3232',
          draw: '#a0a0a0',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #8fb86e 0%, #769656 55%, #5e7d3a 100%)',
        'surface-gradient': 'linear-gradient(180deg, #2b2926 0%, #211f1d 100%)',
        'brand-radial':
          'radial-gradient(ellipse 100% 55% at 50% -8%, rgba(118,150,86,0.18), transparent 58%)',
      },
      boxShadow: {
        chess: '0 4px 20px rgba(0,0,0,0.5)',
        'chess-lg': '0 8px 40px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(118,150,86,0.35), 0 10px 34px -8px rgba(118,150,86,0.45)',
        card: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 10px 28px -16px rgba(0,0,0,0.85)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.2s ease-out both',
        float: 'float 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
