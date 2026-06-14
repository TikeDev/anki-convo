'use client'

import { FormEvent, type Reducer, useMemo, useReducer, useState } from 'react'
import {
  CircleHelp,
  Eye,
  Keyboard,
  LogOut,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Settings,
  SkipForward,
  StepBack,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  createInitialReviewState,
  getCurrentDeck,
  getDeckById,
  reviewDecks,
  reviewSessionReducer,
  selectCurrentCard,
} from '@/lib/review-session.mjs'

const voiceCommands = [
  'reveal answer',
  'again / hard / good / easy',
  'skip this card',
  'previous card',
  'switch to Spanish',
  'list decks',
  'sync now',
  'pause / resume',
  'end session',
]

const ratingActions = [
  { rating: 'again', label: 'Again' },
  { rating: 'hard', label: 'Hard' },
  { rating: 'good', label: 'Good' },
  { rating: 'easy', label: 'Easy' },
]

const typedReviewSessionReducer = reviewSessionReducer as Reducer<any, any>

type TranscriptEntry = { id: string; speaker: 'Agent' | 'You'; text: string }
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
  const [state, dispatch] = useReducer(
    typedReviewSessionReducer,
    undefined,
    createInitialReviewState,
  )
  const [typedMessage, setTypedMessage] = useState('')
  const [selectedDeckId, setSelectedDeckId] = useState(state.currentDeckId)
  const currentDeck = getCurrentDeck(state)
  const currentCard = selectCurrentCard(state)
  const latestUser = [...state.transcript].reverse().find((item) => item.speaker === 'You')
  const latestAgent = [...state.transcript].reverse().find((item) => item.speaker === 'Agent')
  const remainingCards = Math.max(0, currentDeck.dueCount - state.reviewedCount)
  const selectedDeck = getDeckById(selectedDeckId)
  const cardPosition = state.currentCardIndex + 1
  const totalCards = currentDeck.cards.length
  const reviewProgress = totalCards > 0 ? Math.round((state.reviewedCount / totalCards) * 100) : 0

  const deckOptions = useMemo(
    () =>
      reviewDecks.map((deck) => (
        <option key={deck.id} value={deck.id}>
          {deck.name} - {deck.dueCount} due
        </option>
      )),
    [],
  )

  function sendTextMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = typedMessage.trim()
    if (!text) return

    const commandHandled = dispatchTextCommand(text)
    if (!commandHandled) {
      dispatch({ type: 'SEND_TEXT', text })
    }
    setTypedMessage('')
  }

  function dispatchTextCommand(text: string) {
    const normalized = text.toLowerCase()

    if (normalized === 'confirm') {
      dispatch({ type: 'CONFIRM_DECK_SWITCH' })
      return true
    }
    if (normalized === 'cancel') {
      dispatch({ type: 'CANCEL_DECK_SWITCH' })
      return true
    }
    if (normalized.includes('reveal')) {
      dispatch({ type: 'REVEAL_ANSWER' })
      return true
    }
    if (normalized.includes('skip')) {
      dispatch({ type: 'SKIP_CARD' })
      return true
    }
    if (normalized.includes('previous') || normalized.includes('go back')) {
      dispatch({ type: 'PREVIOUS_CARD' })
      return true
    }
    if (normalized.includes('sync')) {
      dispatch({ type: 'SYNC_NOW' })
      return true
    }
    if (normalized.includes('end session')) {
      dispatch({ type: 'END_SESSION' })
      return true
    }
    for (const action of ratingActions) {
      if (normalized === action.rating || normalized.includes(action.rating)) {
        dispatch({ type: 'RATE_CARD', rating: action.rating })
        return true
      }
    }
    const deckMatch = reviewDecks.find((deck) =>
      normalized.includes(deck.name.toLowerCase().split('::')[0]),
    )
    if (normalized.includes('switch') && deckMatch) {
      dispatch({ type: 'REQUEST_DECK_SWITCH', deckId: deckMatch.id })
      setSelectedDeckId(deckMatch.id)
      return true
    }

    return false
  }

  function requestSelectedDeckSwitch() {
    dispatch({ type: 'REQUEST_DECK_SWITCH', deckId: selectedDeckId })
  }

  return (
    <main className="review-shell">
      <a className="skip-link" href="#review-content">
        Skip to review content
      </a>

      <header className="app-header" aria-label="Session overview">
        <div className="brand-lockup">
          <span className="app-mark" aria-hidden="true">
            <Mic size={22} strokeWidth={2.1} />
          </span>
          <div>
            <p className="eyebrow">AnkiConvo</p>
            <h1>Voice review</h1>
          </div>
        </div>
        <div className="session-stats" aria-label="Current review stats">
          <span>{currentDeck.name}</span>
          <span>{remainingCards} due</span>
          <span>
            {cardPosition}/{totalCards}
          </span>
        </div>
      </header>

      <div className="app-workspace">
        <section className="session-card" id="review-content" aria-labelledby="current-card-title">
          <div className="session-card-header">
            <div>
              <p className="eyebrow">Current card</p>
              <h2 id="current-card-title">{currentCard.front}</h2>
            </div>
            <div className="voice-state" aria-live="polite">
              <span className={`status-dot ${state.isMuted ? 'muted' : ''}`} aria-hidden="true" />
              <span>{state.status}</span>
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

          <article className="flashcard" aria-labelledby="current-card-title">
            <div className="card-kicker">Front</div>
            <p className="card-prompt">{currentCard.front}</p>
            <div className="answer-panel" aria-live="polite">
              {state.showAnswer ? (
                <>
                  <span>Answer</span>
                  <p>{currentCard.back}</p>
                </>
              ) : (
                <p>Answer aloud, type a response, or say &quot;reveal answer&quot;.</p>
              )}
            </div>
          </article>

          <div className="review-feedback" aria-live="polite">
            {state.undoNotice ? <p className="notice">{state.undoNotice}</p> : null}
            <div className="caption-strip" aria-label="Latest transcript">
              <p>
                <strong>You</strong>
                <span>{latestUser?.text ?? 'Waiting for your first answer.'}</span>
              </p>
              <p>
                <strong>Agent</strong>
                <span>{latestAgent?.text ?? 'Ready to begin.'}</span>
              </p>
            </div>
          </div>
        </section>

        <aside className="session-rail" aria-label="Review support">
          <section className="rail-panel" aria-labelledby="progress-title">
            <div className="rail-heading">
              <p className="eyebrow">Session</p>
              <h2 id="progress-title">Progress</h2>
            </div>
            <dl className="metric-list">
              <div>
                <dt>Reviewed</dt>
                <dd>{state.reviewedCount}</dd>
              </div>
              <div>
                <dt>Remaining</dt>
                <dd>{remainingCards}</dd>
              </div>
              <div>
                <dt>Card</dt>
                <dd>
                  {cardPosition}/{totalCards}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rail-panel" aria-labelledby="quick-title">
            <div className="rail-heading">
              <p className="eyebrow">Commands</p>
              <h2 id="quick-title">Say or tap</h2>
            </div>
            <ul className="command-list">
              <li>reveal answer</li>
              <li>again, hard, good, easy</li>
              <li>skip this card</li>
              <li>sync now</li>
            </ul>
          </section>
        </aside>
      </div>

      {state.helpOpen ? (
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
              onClick={() => dispatch({ type: 'TOGGLE_HELP' })}
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

      {state.settingsOpen ? (
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
              onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <div className="settings-grid">
            <label>
              <span>Voice mode</span>
              <select defaultValue="hands-free">
                <option value="hands-free">Hands-free listening</option>
                <option value="push-to-talk">Push to talk</option>
              </select>
            </label>
            <label>
              <span>Microphone</span>
              <select defaultValue="system">
                <option value="system">System microphone</option>
                <option value="muted">Muted for text mode</option>
              </select>
            </label>
            <label>
              <span>Speaker</span>
              <select defaultValue="system">
                <option value="system">System default</option>
                <option value="captions">Captions only</option>
              </select>
            </label>
            <button type="button" className="secondary-button" onClick={() => dispatch({ type: 'SYNC_NOW' })}>
              <RotateCcw aria-hidden="true" size={17} />
              Sync now
            </button>
          </div>
        </section>
      ) : null}

      <nav className="bottom-controls" aria-label="Review controls">
        <ControlButton icon={Settings} label="Settings" onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })} />
        <ControlButton
          icon={Keyboard}
          label="Text"
          pressed={state.mode === 'text'}
          onClick={() => dispatch({ type: 'OPEN_TEXT_MODE' })}
        />
        <button
          type="button"
          className="control-button primary"
          aria-label={state.isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={state.isMuted}
          onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
        >
          {state.isMuted ? (
            <MicOff aria-hidden="true" size={19} strokeWidth={2.1} />
          ) : (
            <Mic aria-hidden="true" size={19} strokeWidth={2.1} />
          )}
          <span>{state.isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
        <ControlButton icon={CircleHelp} label="Help" onClick={() => dispatch({ type: 'TOGGLE_HELP' })} />
        <ControlButton icon={LogOut} label="End" tone="danger" onClick={() => dispatch({ type: 'END_SESSION' })} />
      </nav>

      {state.pendingDeckSwitch ? (
        <section className="floating-panel confirm-panel" aria-labelledby="confirm-title" aria-live="assertive">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Confirm</p>
              <h2 id="confirm-title">Switch deck?</h2>
            </div>
          </div>
          <p>
            Sync current progress and start <strong>{state.pendingDeckSwitch.deckName}</strong>.
          </p>
          <div className="confirm-actions">
            <button type="button" className="secondary-button" onClick={() => dispatch({ type: 'CANCEL_DECK_SWITCH' })}>
              Cancel
            </button>
            <button type="button" className="danger-button" onClick={() => dispatch({ type: 'CONFIRM_DECK_SWITCH' })}>
              Confirm switch
            </button>
          </div>
        </section>
      ) : null}

      {state.mode === 'text' ? (
        <section className="support-drawer" aria-labelledby="text-mode-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Fallback mode</p>
              <h2 id="text-mode-title">Text review</h2>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => dispatch({ type: 'RETURN_TO_VOICE' })}
            >
              <Mic aria-hidden="true" size={17} />
              Return to voice
            </button>
          </div>

          <div className="drawer-info" aria-label="Deck and review information">
            <span>Deck: {currentDeck.name}</span>
            <span>Due: {remainingCards}</span>
            <span>Reviewed: {state.reviewedCount}</span>
            <span>Status: {state.status}</span>
          </div>

          <div className="deck-switcher">
            <label htmlFor="deck-select">Switch deck</label>
            <select
              id="deck-select"
              value={selectedDeckId}
              onChange={(event) => setSelectedDeckId(event.target.value)}
            >
              {deckOptions}
            </select>
            <button type="button" className="secondary-button" onClick={requestSelectedDeckSwitch}>
              Switch deck
            </button>
            {selectedDeck ? <p>{selectedDeck.dueCount} cards due in selected deck.</p> : null}
          </div>

          <div className="quick-actions" aria-label="Text review controls">
            <button type="button" onClick={() => dispatch({ type: 'REVEAL_ANSWER' })}>
              <Eye aria-hidden="true" size={17} />
              Reveal
            </button>
            <button type="button" onClick={() => dispatch({ type: 'SKIP_CARD' })}>
              <SkipForward aria-hidden="true" size={17} />
              Skip
            </button>
            <button type="button" onClick={() => dispatch({ type: 'PREVIOUS_CARD' })}>
              <StepBack aria-hidden="true" size={17} />
              Previous
            </button>
            {ratingActions.map((action) => (
              <button
                key={action.rating}
                type="button"
                className={`rating-button ${action.rating}`}
                onClick={() => dispatch({ type: 'RATE_CARD', rating: action.rating })}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="transcript-log" aria-label="Session transcript">
            {state.transcript.map((entry: TranscriptEntry) => (
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
                placeholder="Type your answer, or try 'switch to Medical'"
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
