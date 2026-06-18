import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

const pageSource = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
const layoutSource = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
const themeToggleSource = readFileSync(new URL('../components/ThemeToggle.tsx', import.meta.url), 'utf8')
const hookSource = readFileSync(new URL('../lib/use-deepgram-voice-agent.ts', import.meta.url), 'utf8')
const tokenRouteSource = readFileSync(new URL('../app/api/deepgram-token/route.ts', import.meta.url), 'utf8')

describe('voice review UI source contract', () => {
  test('uses the centered Anki Convo review layout with icon controls', () => {
    assert.match(pageSource, /from 'lucide-react'/)
    assert.match(pageSource, /useDeepgramVoiceAgent/)
    assert.match(pageSource, /className="app-workspace"/)
    assert.match(pageSource, /className="session-card"/)
    assert.match(pageSource, /className="session-support"/)
    assert.match(pageSource, /\/brand\/anki-convo-mark\.png/)
    assert.match(pageSource, /Start voice session/)
    assert.doesNotMatch(pageSource, /ambient-glow/)
  })

  test('uses the browser Voice Agent hook as the primary session engine', () => {
    assert.match(hookSource, /createDeepgramAgentSettings\(\{ mode: 'browser-demo' \}\)/)
    assert.match(hookSource, /new WebSocket\(DEEPGRAM_AGENT_URL,/)
    assert.match(hookSource, /Sec-WebSocket-Protocol/)
    assert.match(hookSource, /executeDemoAnkiFunction/)
    assert.match(hookSource, /currentQuestionText/)
    assert.match(hookSource, /lastCommittedRating/)
    assert.doesNotMatch(pageSource, /reviewSessionReducer/)
  })

  test('renders the active card question from authoritative card state', () => {
    assert.match(pageSource, /agent\.currentQuestionText/)
    assert.match(pageSource, /className="question-panel"/)
    assert.match(pageSource, /aria-labelledby="active-question-title"/)
    assert.doesNotMatch(pageSource, /<h2 id="current-card-title">\{agent\.currentCard\.front\}<\/h2>/)
  })

  test('keeps answer content hidden until explicit reveal', () => {
    assert.match(hookSource, /isAnswerVisible/)
    assert.match(hookSource, /revealAnswer/)
    assert.match(pageSource, /agent\.isAnswerVisible && agent\.currentCard\.back/)
    assert.doesNotMatch(pageSource, /\{agent\.currentCard\.back \? \(/)
  })

  test('uses progress as the position metric without a duplicate progress heading', () => {
    assert.match(pageSource, /aria-label="Session progress"/)
    assert.match(pageSource, /<dt>Progress<\/dt>/)
    assert.doesNotMatch(pageSource, /id="progress-title"/)
    assert.doesNotMatch(pageSource, /<dt>Card<\/dt>/)
  })

  test('preserves session rail spacing without forcing desktop overflow', () => {
    assert.match(cssSource, /\.rail-heading\s*\{[^}]*margin-bottom: 14px;/s)
    assert.match(cssSource, /\.review-shell\s*\{[^}]*padding: 22px 24px 96px;/s)
    assert.doesNotMatch(cssSource, /\.review-shell\s*\{[^}]*min-height: 100svh;[^}]*padding: 22px 24px 112px;/s)
  })

  test('keeps Deepgram long-lived keys out of client code', () => {
    assert.doesNotMatch(pageSource, /DEEPGRAM_API_KEY/)
    assert.doesNotMatch(hookSource, /DEEPGRAM_API_KEY/)
    assert.match(tokenRouteSource, /process\.env\.DEEPGRAM_API_KEY/)
    assert.match(tokenRouteSource, /access_token/)
    assert.match(tokenRouteSource, /expires_in/)
  })

  test('keeps text mode as a contained support drawer', () => {
    assert.match(pageSource, /className="support-drawer"/)
    assert.match(pageSource, /aria-label="Text review controls"/)
    assert.doesNotMatch(pageSource, /className="text-drawer"/)
  })

  test('keeps voice commands under the Help control', () => {
    assert.match(pageSource, /CircleHelp/)
    assert.match(pageSource, /helpOpen/)
    assert.match(pageSource, /Voice commands/)
    assert.match(pageSource, /command-overlay/)
    assert.match(pageSource, /label="Help"/)
  })

  test('does not render the always-visible say or tap commands rail', () => {
    assert.doesNotMatch(pageSource, /id="quick-title"/)
    assert.doesNotMatch(pageSource, /Say or tap/)
    assert.doesNotMatch(pageSource, /aria-labelledby="quick-title"/)
  })

  test('idle voice state tells the user to click Start', () => {
    assert.match(hookSource, /return 'Click Start'/)
    assert.doesNotMatch(hookSource, /return 'Start talking'/)
  })

  test('keeps the theme toggle global and fixed in the upper right', () => {
    assert.match(layoutSource, /<ThemeToggle \/>/)
    assert.match(themeToggleSource, /className="global-theme-toggle"/)
    assert.match(themeToggleSource, /document\.documentElement\.dataset\.theme = theme/)
    assert.match(cssSource, /:root\[data-theme="light"\]/)
    assert.match(cssSource, /position: fixed;\n  top: 22px;\n  right: 24px;/)
  })

  test('uses the Anki Convo navy and cyan design-system tokens', () => {
    assert.match(cssSource, /--bg: #08111f;/)
    assert.match(cssSource, /--surface: #102134;/)
    assert.match(cssSource, /--surface-raised: #19293f;/)
    assert.match(cssSource, /--accent: #20d0ff;/)
    assert.match(cssSource, /--brand-lime: #b0f040;/)
    assert.match(cssSource, /--again: #c0392b;/)
    assert.match(cssSource, /font-family: var\(--font-sans\);/)
    assert.match(cssSource, /\.app-workspace/)
    assert.doesNotMatch(cssSource, /--accent: #6b6bff;/)
    assert.doesNotMatch(cssSource, /radial-gradient/)
  })
})
