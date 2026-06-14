import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

const pageSource = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
const layoutSource = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
const themeToggleSource = readFileSync(new URL('../components/ThemeToggle.tsx', import.meta.url), 'utf8')

describe('voice review UI source contract', () => {
  test('uses the compact app workspace layout with icon controls', () => {
    assert.match(pageSource, /from 'lucide-react'/)
    assert.match(pageSource, /className="app-workspace"/)
    assert.match(pageSource, /className="session-card"/)
    assert.match(pageSource, /aria-label=\{state\.isMuted \? 'Unmute microphone' : 'Mute microphone'\}/)
  })

  test('keeps text mode as a contained support drawer', () => {
    assert.match(pageSource, /className="support-drawer"/)
    assert.match(pageSource, /aria-label="Text review controls"/)
    assert.doesNotMatch(pageSource, /className="text-drawer"/)
  })

  test('keeps the theme toggle global and fixed in the upper right', () => {
    assert.match(layoutSource, /<ThemeToggle \/>/)
    assert.match(themeToggleSource, /className="global-theme-toggle"/)
    assert.match(themeToggleSource, /document\.documentElement\.dataset\.theme = theme/)
    assert.match(cssSource, /:root\[data-theme="light"\]/)
    assert.match(cssSource, /position: fixed;\n  top: 22px;\n  right: 24px;/)
  })

  test('uses reference-inspired design tokens instead of the old theatrical palette', () => {
    assert.match(cssSource, /--app-bg: #1a1a1e;/)
    assert.match(cssSource, /--surface: #242428;/)
    assert.match(cssSource, /--accent: #6b6bff;/)
    assert.match(cssSource, /\.app-workspace/)
    assert.doesNotMatch(cssSource, /--bg: #090b0f;/)
  })
})
