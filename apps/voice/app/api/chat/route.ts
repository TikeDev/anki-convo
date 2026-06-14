import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getAnthropic } from '@/lib/anthropic'
import { getUserFromRequest } from '@/lib/auth'
import { getMcpUrlForUser } from '@/lib/anki'

// The MCP connector (remote `mcp_servers` on the Messages API) is a beta — the
// SDK exposes it via client.beta.messages with this header.
const MCP_BETA = 'mcp-client-2025-04-04'

// Voice review assistant prompt (ported from docs/VOICE_AGENT_HANDOVER.md).
const SYSTEM_PROMPT = `You are an Anki flashcard review assistant for a voice interface.

IMPORTANT RULES:
- Keep ALL responses under 2 sentences. This is voice, not text.
- Never use markdown, bullet points, or formatting.
- Never say "I'll" or "Let me" — just do it and report what happened.
- Start the session by syncing, then get due cards from the user's deck.
- Present card fronts one at a time, wait for the user's answer.
- After they answer, reveal the back and ask them to rate: Again, Hard, Good, or Easy.
- Call rate_card immediately when they give a rating.
- Say "Card X of Y" when presenting each card.
- When all cards are done, sync and end the session warmly.`

export async function POST(req: NextRequest) {
  // 1. Authenticate (Accounts + Security)
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validate input
  let body: { messages?: Anthropic.MessageParam[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const messages = body.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 })
  }

  // 3. Resolve this user's Anki MCP endpoint (Routing)
  const mcpUrl = await getMcpUrlForUser(user.id)
  if (!mcpUrl) {
    return NextResponse.json(
      { error: 'No Anki endpoint linked for this user' },
      { status: 409 },
    )
  }

  // 4. Proxy to Claude with the server-held key + the user's MCP endpoint.
  //    The browser never sees ANTHROPIC_API_KEY or the MCP URL.
  try {
    const response = await getAnthropic().beta.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      betas: [MCP_BETA],
      system: SYSTEM_PROMPT,
      messages,
      mcp_servers: [{ type: 'url', url: mcpUrl, name: 'anki-mcp' }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    return NextResponse.json({ text, stop_reason: response.stop_reason })
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: err.message }, { status: err.status ?? 502 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
