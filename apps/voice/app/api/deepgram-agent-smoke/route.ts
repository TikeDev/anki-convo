import { NextResponse } from 'next/server'
import { runDeepgramAgentSmoke } from '@/lib/deepgram-agent-smoke.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'Deepgram Agent smoke test is disabled in production' },
      { status: 404 },
    )
  }

  process.env.WS_NO_BUFFER_UTIL = '1'
  const { default: WebSocket } = await import('ws')

  const result = await runDeepgramAgentSmoke({
    apiKey: process.env.DEEPGRAM_API_KEY,
    WebSocketImpl: WebSocket,
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
