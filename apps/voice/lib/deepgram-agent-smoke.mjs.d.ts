export const DEEPGRAM_AGENT_URL: 'wss://agent.deepgram.com/v1/agent/converse'

export type DeepgramSmokeEvent = {
  type: string
  [key: string]: unknown
}

export type DeepgramSmokeResult =
  | { ok: true; events: DeepgramSmokeEvent[] }
  | { ok: false; error: string; events: DeepgramSmokeEvent[] }

export function createDeepgramAgentSettings(): Record<string, unknown>

export function runDeepgramAgentSmoke(options: {
  apiKey?: string
  WebSocketImpl: unknown
  injectedMessage?: string
  timeoutMs?: number
  collectAfterInjectMs?: number
}): Promise<DeepgramSmokeResult>
