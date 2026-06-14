import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0d',
        surface: '#1a1a1a',
        border: '#2a2a2a',
        salmon: {
          DEFAULT: '#E8736A',
          hover: '#F0948D',
          dim: 'rgba(232,115,106,0.15)',
        },
        text: {
          primary: '#f0f0f0',
          muted: '#888888',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
