import Anthropic from '@anthropic-ai/sdk'

// Lazily construct the Anthropic client so a missing key surfaces on the first
// request rather than crashing the build. The ANTHROPIC_API_KEY lives ONLY on
// the server — it must never reach the browser. This is the whole point of the
// broker (see docs/ARCHITECTURE_DEMO_TO_PRODUCT.md §2).
let client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    client = new Anthropic({ apiKey })
  }
  return client
}
