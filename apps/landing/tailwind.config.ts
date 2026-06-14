import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        border: 'var(--border)',
        salmon: {
          DEFAULT: '#E8736A',
          hover: '#F0948D',
          dim: 'rgba(232,115,106,0.15)',
        },
        text: {
          primary: 'var(--text-primary)',
          muted: 'var(--text-muted)',
        },
        placeholder: 'var(--placeholder)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
