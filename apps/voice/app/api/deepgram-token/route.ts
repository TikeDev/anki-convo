import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

// Point 5 from the architecture doc: Deepgram STT is a browser WebSocket, so we
// can't hide the key behind a plain HTTP proxy. Instead we mint a SHORT-LIVED
// scoped token server-side (with the real DEEPGRAM_API_KEY) and hand only that
// to the browser. If it leaks it expires in seconds and can do nothing but
// transcribe. See docs/ARCHITECTURE_DEMO_TO_PRODUCT.md §5.
//
// NOTE: confirm `/v1/auth/grant` is available on our Deepgram plan (open
// question in the doc's §8). If not, fall back to proxying the STT WebSocket
// through the broker.
const DEEPGRAM_GRANT_URL = 'https://api.deepgram.com/v1/auth/grant'
const TOKEN_TTL_SECONDS = 30

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = process.env.DEEPGRAM_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'DEEPGRAM_API_KEY is not set' }, { status: 500 })
  }

  const resp = await fetch(DEEPGRAM_GRANT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Token ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ttl_seconds: TOKEN_TTL_SECONDS }),
  })

  if (!resp.ok) {
    const detail = await resp.text()
    return NextResponse.json(
      { error: 'Failed to mint Deepgram token', detail },
      { status: 502 },
    )
  }

  const data = (await resp.json()) as { access_token: string; expires_in: number }
  return NextResponse.json({
    access_token: data.access_token,
    expires_in: data.expires_in,
  })
}
