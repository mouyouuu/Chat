/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#111827',
        surface: '#1e293b',
        twitch: '#a855f7',
        tiktok: '#ec4899',
        accent: '#06b6d4',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 32px rgba(6, 182, 212, 0.18)',
        twitch: '0 0 24px rgba(168, 85, 247, 0.2)',
        tiktok: '0 0 24px rgba(236, 72, 153, 0.2)',
      },
    },
  },
  plugins: [],
};
