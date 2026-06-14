export type ReviewMode = 'voice' | 'text'
export type ReviewStatus = 'Listening' | 'Thinking' | 'Speaking' | 'Muted' | 'Switching decks'
export type Rating = 'again' | 'hard' | 'good' | 'easy'

export type ReviewCard = {
  id: string
  front: string
  back: string
}

export type ReviewDeck = {
  id: string
  name: string
  dueCount: number
  cards: ReviewCard[]
}

export type TranscriptEntry = {
  id: string
  speaker: 'Agent' | 'You'
  text: string
}

export type ReviewState = {
  mode: ReviewMode
  status: ReviewStatus
  isMuted: boolean
  currentDeckId: string
  currentCardIndex: number
  reviewedCount: number
  showAnswer: boolean
  helpOpen: boolean
  settingsOpen: boolean
  pendingDeckSwitch: null | {
    deckId: string
    deckName: string
  }
  lastCommittedRating: null | {
    cardId: string
    cardIndex: number
    rating: string
  }
  undoNotice: string | null
  transcript: TranscriptEntry[]
}

export type ReviewAction =
  | { type: 'OPEN_TEXT_MODE' }
  | { type: 'RETURN_TO_VOICE' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'TOGGLE_HELP' }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'RATE_CARD'; rating: Rating | string }
  | { type: 'SKIP_CARD' }
  | { type: 'PREVIOUS_CARD' }
  | { type: 'REQUEST_DECK_SWITCH'; deckId: string }
  | { type: 'CONFIRM_DECK_SWITCH' }
  | { type: 'CANCEL_DECK_SWITCH' }
  | { type: 'SYNC_NOW' }
  | { type: 'END_SESSION' }
  | { type: 'SEND_TEXT'; text: string }

export const ratings: Record<Rating, string>
export const reviewDecks: ReviewDeck[]
export function createInitialReviewState(): ReviewState
export function getCurrentDeck(state: ReviewState): ReviewDeck
export function selectCurrentCard(state: ReviewState): ReviewCard
export function getDeckById(deckId: string): ReviewDeck | null
export function reviewSessionReducer(state: ReviewState, action: ReviewAction): ReviewState
