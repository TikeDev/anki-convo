import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createInitialReviewState,
  reviewSessionReducer,
  selectCurrentCard,
} from './review-session.mjs'

test('text mode mutes the mic without changing the current card', () => {
  const initial = createInitialReviewState()
  const next = reviewSessionReducer(initial, { type: 'OPEN_TEXT_MODE' })

  assert.equal(next.mode, 'text')
  assert.equal(next.isMuted, true)
  assert.equal(selectCurrentCard(next).front, selectCurrentCard(initial).front)
})

test('deck switch requires confirmation before replacing deck state', () => {
  const initial = createInitialReviewState()
  const requested = reviewSessionReducer(initial, {
    type: 'REQUEST_DECK_SWITCH',
    deckId: 'medical',
  })

  assert.equal(requested.currentDeckId, 'spanish')
  assert.equal(requested.pendingDeckSwitch?.deckId, 'medical')

  const confirmed = reviewSessionReducer(requested, { type: 'CONFIRM_DECK_SWITCH' })
  assert.equal(confirmed.currentDeckId, 'medical')
  assert.equal(confirmed.pendingDeckSwitch, null)
  assert.equal(confirmed.reviewedCount, 0)
  assert.equal(selectCurrentCard(confirmed).front, 'What is glycolysis?')
})

test('previous card undoes the last rating and returns to that card', () => {
  const initial = createInitialReviewState()
  const rated = reviewSessionReducer(initial, { type: 'RATE_CARD', rating: 'good' })

  assert.equal(rated.currentCardIndex, 1)
  assert.equal(rated.reviewedCount, 1)

  const previous = reviewSessionReducer(rated, { type: 'PREVIOUS_CARD' })
  assert.equal(previous.currentCardIndex, 0)
  assert.equal(previous.reviewedCount, 0)
  assert.equal(previous.undoNotice, 'Undid Good for the previous card.')
})
