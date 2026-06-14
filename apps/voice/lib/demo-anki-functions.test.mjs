import test from 'node:test'
import assert from 'node:assert/strict'

import { executeDemoAnkiFunction } from './demo-anki-functions.mjs'

test('demo Anki functions return deterministic deck and due card data', async () => {
  const decks = await executeDemoAnkiFunction('get_decks', {})
  assert.deepEqual(
    decks.decks.map((deck) => deck.name),
    ['Spanish::Vocab', 'Medical School::Biochem', 'Default'],
  )

  const due = await executeDemoAnkiFunction('get_due_cards', { deck_name: 'Spanish::Vocab' })
  assert.equal(due.deck_name, 'Spanish::Vocab')
  assert.equal(due.cards[0].id, 'sp-1')
  assert.equal(due.cards[0].front, 'la mesa')
})

test('present_card returns the requested card and rate_card maps ratings to Anki numbers', async () => {
  const card = await executeDemoAnkiFunction('present_card', { card_id: 'sp-2' })
  assert.deepEqual(card, {
    card: {
      id: 'sp-2',
      deck_name: 'Spanish::Vocab',
      front: 'el cuaderno',
      back: 'the notebook',
      position: 2,
      total: 3,
    },
  })

  assert.deepEqual(await executeDemoAnkiFunction('rate_card', { card_id: 'sp-2', rating: 'good' }), {
    ok: true,
    card_id: 'sp-2',
    rating: 3,
    rating_label: 'Good',
    next_card_id: 'sp-3',
  })
  assert.deepEqual(await executeDemoAnkiFunction('rate_card', { card_id: 'sp-2', rating: 4 }), {
    ok: true,
    card_id: 'sp-2',
    rating: 4,
    rating_label: 'Easy',
    next_card_id: 'sp-3',
  })
})

test('unknown demo function names return a structured error', async () => {
  assert.deepEqual(await executeDemoAnkiFunction('delete_everything', {}), {
    ok: false,
    error: 'Unsupported demo Anki function: delete_everything',
  })
})
