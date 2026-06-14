export const demoDecks = [
  {
    id: 'spanish',
    name: 'Spanish::Vocab',
    cards: [
      { id: 'sp-1', front: 'la mesa', back: 'the table' },
      { id: 'sp-2', front: 'el cuaderno', back: 'the notebook' },
      { id: 'sp-3', front: 'despertarse', back: 'to wake up' },
    ],
  },
  {
    id: 'medical',
    name: 'Medical School::Biochem',
    cards: [
      {
        id: 'med-1',
        front: 'What is glycolysis?',
        back: 'The pathway that breaks glucose into pyruvate while producing ATP and NADH.',
      },
      { id: 'med-2', front: 'Rate-limiting enzyme of glycolysis', back: 'Phosphofructokinase-1.' },
    ],
  },
  {
    id: 'default',
    name: 'Default',
    cards: [
      { id: 'default-1', front: 'What does SRS stand for?', back: 'Spaced repetition system.' },
      { id: 'default-2', front: 'What should happen before ending a review?', back: 'Sync progress back to Anki.' },
    ],
  },
]

const ratingMap = new Map([
  ['1', { rating: 1, label: 'Again' }],
  ['again', { rating: 1, label: 'Again' }],
  ['2', { rating: 2, label: 'Hard' }],
  ['hard', { rating: 2, label: 'Hard' }],
  ['3', { rating: 3, label: 'Good' }],
  ['good', { rating: 3, label: 'Good' }],
  ['4', { rating: 4, label: 'Easy' }],
  ['easy', { rating: 4, label: 'Easy' }],
])

export async function executeDemoAnkiFunction(name, args = {}) {
  switch (name) {
    case 'sync':
      return {
        ok: true,
        message: 'Demo collection synced.',
      }
    case 'get_decks':
      return {
        decks: demoDecks.map((deck) => ({
          id: deck.id,
          name: deck.name,
          due_count: deck.cards.length,
        })),
      }
    case 'get_due_cards':
      return getDueCards(args)
    case 'present_card':
      return presentCard(args)
    case 'rate_card':
      return rateCard(args)
    default:
      return {
        ok: false,
        error: `Unsupported demo Anki function: ${name}`,
      }
  }
}

function getDueCards(args) {
  const deck = findDeck(args.deck_name) ?? demoDecks[0]
  return {
    deck_name: deck.name,
    cards: deck.cards.map((card, index) => ({
      id: card.id,
      front: card.front,
      position: index + 1,
      total: deck.cards.length,
    })),
  }
}

function presentCard(args) {
  const found = findCard(args.card_id)
  if (!found) {
    return {
      ok: false,
      error: `Card not found: ${args.card_id ?? ''}`,
    }
  }

  return {
    card: {
      id: found.card.id,
      deck_name: found.deck.name,
      front: found.card.front,
      back: found.card.back,
      position: found.index + 1,
      total: found.deck.cards.length,
    },
  }
}

function rateCard(args) {
  const found = findCard(args.card_id)
  if (!found) {
    return {
      ok: false,
      error: `Card not found: ${args.card_id ?? ''}`,
    }
  }

  const rating = normalizeRating(args.rating)
  if (!rating) {
    return {
      ok: false,
      error: `Unsupported rating: ${args.rating ?? ''}`,
    }
  }

  return {
    ok: true,
    card_id: found.card.id,
    rating: rating.rating,
    rating_label: rating.label,
    next_card_id: found.deck.cards[found.index + 1]?.id ?? null,
  }
}

function findDeck(deckName) {
  if (!deckName) return null
  const normalized = String(deckName).toLowerCase()
  return demoDecks.find((deck) => deck.name.toLowerCase() === normalized || deck.id === normalized) ?? null
}

function findCard(cardId) {
  for (const deck of demoDecks) {
    const index = deck.cards.findIndex((card) => card.id === cardId)
    if (index !== -1) {
      return { deck, card: deck.cards[index], index }
    }
  }
  return null
}

function normalizeRating(rating) {
  return ratingMap.get(String(rating).toLowerCase()) ?? null
}
