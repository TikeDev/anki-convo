export const ratings = {
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
}

export const reviewDecks = [
  {
    id: 'spanish',
    name: 'Spanish::Vocab',
    dueCount: 42,
    cards: [
      {
        id: 'sp-1',
        front: 'la mesa',
        back: 'the table',
      },
      {
        id: 'sp-2',
        front: 'el cuaderno',
        back: 'the notebook',
      },
      {
        id: 'sp-3',
        front: 'despertarse',
        back: 'to wake up',
      },
    ],
  },
  {
    id: 'medical',
    name: 'Medical School::Biochem',
    dueCount: 18,
    cards: [
      {
        id: 'med-1',
        front: 'What is glycolysis?',
        back: 'The pathway that breaks glucose into pyruvate while producing ATP and NADH.',
      },
      {
        id: 'med-2',
        front: 'Rate-limiting enzyme of glycolysis',
        back: 'Phosphofructokinase-1.',
      },
    ],
  },
  {
    id: 'default',
    name: 'Default',
    dueCount: 9,
    cards: [
      {
        id: 'default-1',
        front: 'What does SRS stand for?',
        back: 'Spaced repetition system.',
      },
      {
        id: 'default-2',
        front: 'What should happen before ending a review?',
        back: 'Sync progress back to Anki.',
      },
    ],
  },
]

const initialTranscript = [
  {
    id: 'agent-1',
    speaker: 'Agent',
    text: 'Card 1. What does "la mesa" mean?',
  },
]

export function createInitialReviewState() {
  return {
    mode: 'voice',
    status: 'Listening',
    isMuted: false,
    currentDeckId: 'spanish',
    currentCardIndex: 0,
    reviewedCount: 0,
    showAnswer: false,
    helpOpen: false,
    settingsOpen: false,
    pendingDeckSwitch: null,
    lastCommittedRating: null,
    undoNotice: null,
    transcript: initialTranscript,
  }
}

export function getCurrentDeck(state) {
  return reviewDecks.find((deck) => deck.id === state.currentDeckId) ?? reviewDecks[0]
}

export function selectCurrentCard(state) {
  const deck = getCurrentDeck(state)
  return deck.cards[state.currentCardIndex] ?? deck.cards[0]
}

export function getDeckById(deckId) {
  return reviewDecks.find((deck) => deck.id === deckId) ?? null
}

function appendTranscript(state, speaker, text) {
  return {
    ...state,
    transcript: [
      ...state.transcript,
      {
        id: `${speaker.toLowerCase()}-${state.transcript.length + 1}`,
        speaker,
        text,
      },
    ],
  }
}

function resetForDeck(state, deckId) {
  const deck = getDeckById(deckId) ?? getCurrentDeck(state)
  return {
    ...state,
    status: 'Listening',
    currentDeckId: deck.id,
    currentCardIndex: 0,
    reviewedCount: 0,
    showAnswer: false,
    pendingDeckSwitch: null,
    lastCommittedRating: null,
    undoNotice: null,
    transcript: [
      {
        id: 'agent-1',
        speaker: 'Agent',
        text: `Switched to ${deck.name}. Card 1. ${deck.cards[0]?.front ?? 'No due cards.'}`,
      },
    ],
  }
}

export function reviewSessionReducer(state, action) {
  switch (action.type) {
    case 'OPEN_TEXT_MODE':
      return {
        ...state,
        mode: 'text',
        isMuted: true,
        status: 'Muted',
        settingsOpen: false,
      }
    case 'RETURN_TO_VOICE':
      return {
        ...state,
        mode: 'voice',
        isMuted: false,
        status: 'Listening',
      }
    case 'TOGGLE_MUTE':
      return {
        ...state,
        isMuted: !state.isMuted,
        status: state.isMuted ? 'Listening' : 'Muted',
      }
    case 'TOGGLE_HELP':
      return {
        ...state,
        helpOpen: !state.helpOpen,
        settingsOpen: false,
      }
    case 'TOGGLE_SETTINGS':
      return {
        ...state,
        settingsOpen: !state.settingsOpen,
        helpOpen: false,
      }
    case 'REVEAL_ANSWER':
      return appendTranscript(
        {
          ...state,
          showAnswer: true,
          status: 'Speaking',
        },
        'Agent',
        `The answer is "${selectCurrentCard(state).back}". How should I rate it?`,
      )
    case 'RATE_CARD': {
      const deck = getCurrentDeck(state)
      const currentCard = selectCurrentCard(state)
      const nextIndex = Math.min(state.currentCardIndex + 1, deck.cards.length - 1)
      const isLastCard = state.currentCardIndex >= deck.cards.length - 1
      const ratingLabel = ratings[action.rating] ?? action.rating
      const nextState = {
        ...state,
        status: isLastCard ? 'Speaking' : 'Listening',
        currentCardIndex: nextIndex,
        reviewedCount: state.reviewedCount + 1,
        showAnswer: false,
        lastCommittedRating: {
          cardId: currentCard.id,
          cardIndex: state.currentCardIndex,
          rating: ratingLabel,
        },
        undoNotice: null,
      }
      return appendTranscript(
        nextState,
        'Agent',
        isLastCard
          ? `Rated ${ratingLabel}. All cards in this preview are reviewed.`
          : `Rated ${ratingLabel}. Card ${nextIndex + 1}. ${deck.cards[nextIndex].front}`,
      )
    }
    case 'SKIP_CARD': {
      const deck = getCurrentDeck(state)
      const nextIndex = Math.min(state.currentCardIndex + 1, deck.cards.length - 1)
      return appendTranscript(
        {
          ...state,
          currentCardIndex: nextIndex,
          showAnswer: false,
          status: 'Listening',
        },
        'Agent',
        nextIndex === state.currentCardIndex
          ? 'No more preview cards to skip.'
          : `Skipped. Card ${nextIndex + 1}. ${deck.cards[nextIndex].front}`,
      )
    }
    case 'PREVIOUS_CARD': {
      if (!state.lastCommittedRating) {
        return appendTranscript(
          {
            ...state,
            status: 'Listening',
            undoNotice: 'No rated card to undo yet.',
          },
          'Agent',
          'No rated card to undo yet.',
        )
      }
      const rating = state.lastCommittedRating.rating
      const previousState = {
        ...state,
        status: 'Listening',
        currentCardIndex: state.lastCommittedRating.cardIndex,
        reviewedCount: Math.max(0, state.reviewedCount - 1),
        showAnswer: false,
        lastCommittedRating: null,
        undoNotice: `Undid ${rating} for the previous card.`,
      }
      return appendTranscript(previousState, 'Agent', previousState.undoNotice)
    }
    case 'REQUEST_DECK_SWITCH': {
      const deck = getDeckById(action.deckId)
      if (!deck || deck.id === state.currentDeckId) return state
      return appendTranscript(
        {
          ...state,
          status: 'Switching decks',
          pendingDeckSwitch: {
            deckId: deck.id,
            deckName: deck.name,
          },
        },
        'Agent',
        `Switch to ${deck.name}? Confirm to sync progress and start that deck.`,
      )
    }
    case 'CONFIRM_DECK_SWITCH':
      return state.pendingDeckSwitch
        ? resetForDeck(state, state.pendingDeckSwitch.deckId)
        : state
    case 'CANCEL_DECK_SWITCH':
      return appendTranscript(
        {
          ...state,
          status: 'Listening',
          pendingDeckSwitch: null,
        },
        'Agent',
        'Deck switch cancelled.',
      )
    case 'SYNC_NOW':
      return appendTranscript(
        {
          ...state,
          status: 'Speaking',
        },
        'Agent',
        'Progress synced.',
      )
    case 'END_SESSION':
      return appendTranscript(
        {
          ...state,
          status: 'Speaking',
          isMuted: true,
        },
        'Agent',
        'Session ended. Progress is ready to sync.',
      )
    case 'SEND_TEXT': {
      const withUserMessage = appendTranscript(state, 'You', action.text)
      return appendTranscript(
        {
          ...withUserMessage,
          status: 'Thinking',
        },
        'Agent',
        'Got it. Use Reveal or a rating when you are ready.',
      )
    }
    default:
      return state
  }
}
