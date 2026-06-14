export type DemoAnkiDeck = {
  id: string
  name: string
  cards: Array<{
    id: string
    front: string
    back: string
  }>
}

export const demoDecks: DemoAnkiDeck[]

export function executeDemoAnkiFunction(
  name: string,
  args?: Record<string, unknown>,
): Promise<Record<string, unknown>>
