'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'dark' | 'light'

const storageKey = 'anki-convo-voice-theme'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    const initial =
      stored === 'dark' || stored === 'light'
        ? stored
        : window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'

    setTheme(initial)
    applyTheme(initial)
  }, [])

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
      localStorage.setItem(storageKey, nextTheme)
      applyTheme(nextTheme)
      return nextTheme
    })
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="global-theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
    >
      {isDark ? (
        <Sun aria-hidden="true" size={18} strokeWidth={2.1} />
      ) : (
        <Moon aria-hidden="true" size={18} strokeWidth={2.1} />
      )}
    </button>
  )
}
