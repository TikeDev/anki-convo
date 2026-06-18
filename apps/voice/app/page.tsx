'use client'

import { FormEvent, useMemo, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import {
  CircleHelp,
  Keyboard,
  LogOut,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Settings,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { demoDecks } from '@/lib/demo-anki-functions.mjs'
import { useDeepgramVoiceAgent } from '@/lib/use-deepgram-voice-agent'

const voiceCommands = [
  '"start Anki review"',
  '"review Spanish"',
  '"reveal answer"',
  '"again / hard / good / easy"',
  '"sync now"',
  '"end session"',
]

function briefTranscriptText(text: string, maxLength = 120) {
  const compact = text.trim().replace(/\s+/g, ' ')
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, maxLength - 1).trim()}…`
}

type ControlButtonProps = {
  icon: LucideIcon
  label: string
  onClick?: () => void
  tone?: 'default' | 'danger'
  pressed?: boolean
}

function ControlButton({ icon: Icon, label, onClick, tone = 'default', pressed }: ControlButtonProps) {
  return (
    <button
      type="button"
      className={`control-button ${tone !== 'default' ? tone : ''}`.trim()}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={2.1} />
      <span>{label}</span>
    </button>
  )
}

export default function Page() {
  const agent = useDeepgramVoiceAgent()
  const [typedMessage, setTypedMessage] = useState('')
  const [textModeOpen, setTextModeOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const latestUser = [...agent.transcript].reverse().find((item) => item.speaker === 'You')
  const latestAgent = [...agent.transcript].reverse().find((item) => item.speaker === 'Agent')
  const latestUserText = latestUser ? briefTranscriptText(latestUser.text) : 'Waiting for your first answer.'
  const remainingCards = Math.max(0, agent.currentCard.total - agent.reviewedCount)
  const reviewProgress =
    agent.currentCard.total > 0 ? Math.round((agent.reviewedCount / agent.currentCard.total) * 100) : 0
  const ambientIntensity = agent.isConnected && !agent.isMuted ? Math.min(agent.micLevel * 6, 1) : 0
  const ambientStyle = {
    '--ambient-intensity': ambientIntensity,
    '--ambient-shadow-size': `${14 + ambientIntensity * 54}px`,
    '--ambient-shadow-color': `rgba(32, 208, 255, ${0.1 + ambientIntensity * 0.24})`,
    '--ambient-shadow-opacity': 0.12 + ambientIntensity * 0.3,
  } as CSSProperties

  const deckOptions = useMemo(
    () =>
      demoDecks.map((deck) => (
        <option key={deck.id} value={deck.name}>
          {deck.name} - {deck.cards.length} due
        </option>
      )),
    [],
  )

  function sendTextMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = typedMessage.trim()
    if (!text) return
    agent.injectText(text)
    setTypedMessage('')
  }

  function togglePrimaryMic() {
    if (!agent.isConnected) {
      void agent.connect()
      return
    }
    agent.toggleMute()
  }

  return (
    <main className="review-shell" style={ambientStyle}>
      <a className="skip-link" href="#review-content">
        Skip to review content
      </a>
      <div
        className="ambient-glow"
        aria-hidden="true"
        style={{
          opacity: ambientIntensity * 0.86,
          transform: `translate(-50%, -50%) scale(${0.82 + ambientIntensity * 0.5})`,
        }}
      />

      <header className="app-header" aria-label="Session overview">
        <div className="brand-lockup">
          <span className="app-mark" aria-hidden="true">
            <Image src="/brand/anki-convo-mark.png" alt="" width={30} height={30} priority />
          </span>
          <div>
            <p className="eyebrow">AnkiConvo</p>
            <h1>Voice review</h1>
          </div>
        </div>
        <div className="session-stats" aria-label="Current review stats">
          <span>{agent.currentCard.deckName}</span>
          <span>{remainingCards} due</span>
          <span>
            {agent.currentCard.position}/{agent.currentCard.total}
          </span>
        </div>
      </header>

      <div className="app-workspace">
        <section className="session-card" id="review-content" aria-labelledby="active-question-title">
          <div className="session-card-header">
            <div>
              <p className="eyebrow">Current question</p>
              <h2 id="active-question-title">{agent.currentQuestionText}</h2>
            </div>
            <div className="voice-state" aria-live="polite">
              <span className={`status-dot ${agent.isMuted || agent.status === 'error' ? 'muted' : ''}`} aria-hidden="true" />
              <span>{agent.error ?? agent.statusLabel}</span>
            </div>
          </div>

          <div
            className="progress-track"
            aria-label="Session progress"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={reviewProgress}
            role="progressbar"
          >
            <span style={{ width: `${reviewProgress}%` }} />
          </div>

          <article className="flashcard" aria-labelledby="active-question-title">
            <div className="card-kicker">Front</div>
            <div className="card-deck">{agent.currentCard.deckName}</div>
            <div className="question-panel">
              <p className="card-prompt">{agent.currentQuestionText}</p>
            </div>
            <div className="answer-panel" aria-live="polite">
              {agent.isAnswerVisible && agent.currentCard.back ? (
                <>
                  <span>Answer</span>
                  <p>{agent.currentCard.back}</p>
                </>
              ) : (
                <p>Answer aloud, then reveal when ready.</p>
              )}
            </div>
          </article>

          <div className="review-feedback" aria-live="polite">
            {agent.error ? <p className="notice">{agent.error}</p> : null}
            {agent.lastCommittedRating ? (
              <p className="rating-notice">Last rating: {agent.lastCommittedRating.ratingLabel}</p>
            ) : null}
            <div className="caption-strip" aria-label="Latest transcript">
              <p>
                <strong>You</strong>
                <span>{latestUserText}</span>
              </p>
              <p>
                <strong>Agent</strong>
                <span>{latestAgent?.text ?? 'Ready to begin.'}</span>
              </p>
            </div>
          </div>
        </section>

        <aside className="session-support" aria-label="Review support">
          <section className="rail-panel" aria-label="Session progress">
            <div className="rail-heading">
              <p className="eyebrow">Session</p>
            </div>
            <dl className="metric-list">
              <div>
                <dt>Reviewed</dt>
                <dd>{agent.reviewedCount}</dd>
              </div>
              <div>
                <dt>Remaining</dt>
                <dd>{remainingCards}</dd>
              </div>
              <div>
                <dt>Progress</dt>
                <dd>
                  {agent.currentCard.position}/{agent.currentCard.total}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      {helpOpen ? (
        <section className="floating-panel command-overlay" aria-labelledby="command-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Say help</p>
              <h2 id="command-title">Voice commands</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Close voice commands"
              onClick={() => setHelpOpen(false)}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <ul className="command-list full">
            {voiceCommands.map((command) => (
              <li key={command}>{command}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {settingsOpen ? (
        <section className="floating-panel settings-panel" aria-labelledby="settings-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Session</p>
              <h2 id="settings-title">Settings</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Close settings"
              onClick={() => setSettingsOpen(false)}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <div className="settings-grid">
            <label>
              <span>Voice mode</span>
              <select
                value={agent.voiceMode}
                onChange={(event) => agent.setVoiceMode(event.target.value === 'push-to-talk' ? 'push-to-talk' : 'free-talk')}
              >
                <option value="free-talk">Free talk</option>
                <option value="push-to-talk">Push to talk</option>
              </select>
            </label>
            <label>
              <span>Microphone</span>
              <select value={agent.selectedInputDeviceId} onChange={(event) => agent.setSelectedInput(event.target.value)}>
                <option value="">System microphone</option>
                {agent.inputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Speaker</span>
              <select value={agent.selectedOutputDeviceId} onChange={(event) => agent.setSelectedOutput(event.target.value)}>
                <option value="">System default</option>
                {agent.outputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="secondary-button" onClick={() => agent.injectText('sync now')}>
              <RotateCcw aria-hidden="true" size={17} />
              Sync now
            </button>
          </div>
        </section>
      ) : null}

      <nav className="bottom-controls" aria-label="Review controls">
        <ControlButton icon={Settings} label="Settings" onClick={() => setSettingsOpen((open) => !open)} />
        <ControlButton
          icon={Keyboard}
          label="Text"
          pressed={textModeOpen}
          onClick={() => setTextModeOpen((open) => !open)}
        />
        <button
          type="button"
          className="control-button primary"
          aria-label={
            agent.isConnected
              ? agent.isMuted
                ? 'Unmute microphone'
                : 'Mute microphone'
              : 'Start voice session'
          }
          aria-pressed={agent.isMuted}
          onClick={togglePrimaryMic}
        >
          {agent.isMuted ? (
            <MicOff aria-hidden="true" size={19} strokeWidth={2.1} />
          ) : (
            <Mic aria-hidden="true" size={19} strokeWidth={2.1} />
          )}
          <span>{agent.isConnected ? (agent.isMuted ? 'Unmute' : 'Mute') : 'Start'}</span>
        </button>
        <ControlButton icon={CircleHelp} label="Help" onClick={() => setHelpOpen((open) => !open)} />
        <ControlButton icon={LogOut} label="End" tone="danger" onClick={agent.disconnect} />
      </nav>

      {textModeOpen ? (
        <section className="support-drawer" aria-labelledby="text-mode-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Fallback mode</p>
              <h2 id="text-mode-title">Text review</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setTextModeOpen(false)}>
              <Mic aria-hidden="true" size={17} />
              Return to voice
            </button>
          </div>

          <div className="drawer-info" aria-label="Deck and review information">
            <span>Deck: {agent.currentCard.deckName}</span>
            <span>Due: {remainingCards}</span>
            <span>Reviewed: {agent.reviewedCount}</span>
            <span>Status: {agent.statusLabel}</span>
          </div>

          <div className="deck-switcher">
            <label htmlFor="deck-select">Deck prompt</label>
            <select id="deck-select" onChange={(event) => agent.injectText(`review ${event.target.value}`)} defaultValue="">
              <option value="" disabled>
                Choose a deck
              </option>
              {deckOptions}
            </select>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                agent.revealAnswer()
                agent.injectText('reveal answer')
              }}
            >
              Reveal answer
            </button>
          </div>

          <div className="quick-actions" aria-label="Text review controls">
            <button type="button" onClick={() => agent.injectText('again')}>
              Again
            </button>
            <button type="button" onClick={() => agent.injectText('hard')}>
              Hard
            </button>
            <button type="button" onClick={() => agent.injectText('good')}>
              Good
            </button>
            <button type="button" onClick={() => agent.injectText('easy')}>
              Easy
            </button>
            <button type="button" onClick={() => agent.injectText('sync now')}>
              <Volume2 aria-hidden="true" size={17} />
              Sync
            </button>
          </div>

          <div className="transcript-log" aria-label="Session transcript">
            {agent.transcript.map((entry) => (
              <p key={entry.id} className={entry.speaker === 'You' ? 'user-line' : 'agent-line'}>
                <strong>{entry.speaker}</strong>
                <span>{entry.text}</span>
              </p>
            ))}
          </div>

          <form className="text-form" onSubmit={sendTextMessage}>
            <label htmlFor="text-message">Type an answer or command</label>
            <div>
              <input
                id="text-message"
                value={typedMessage}
                onChange={(event) => setTypedMessage(event.target.value)}
                placeholder="Type your answer, or try 'review Spanish'"
              />
              <button type="submit" className="primary-control">
                <Send aria-hidden="true" size={17} />
                Send
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </main>
  )
}
