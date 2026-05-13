import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 900: '#312e81',
        },
        accent: { 500: '#06b6d4', 600: '#0891b2' },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06)',
        card: '0 4px 12px -4px rgba(15,23,42,.08)',
        glow: '0 0 0 1px rgba(99,102,241,.08), 0 8px 25px -8px rgba(99,102,241,.35)',
      },
    },
  },
  plugins: [],
};

export default config;
