# Broker Code — Walkthrough & Decisions

A code-level tour of the broker: what each piece does, and **why it's written that way**. For the plain-English overview see [`README.md`](./README.md); for the product reasoning see [`docs/ARCHITECTURE_DEMO_TO_PRODUCT.md`](../../docs/ARCHITECTURE_DEMO_TO_PRODUCT.md).

---

## The core idea in code terms

Every paid/sensitive call funnels through one server with the same three steps:

```
authenticate(req)  →  resolve the user's Anki endpoint  →  call the API with server-held secrets
```

If any of those three is missing, the request is rejected before a cent is spent. That pattern is repeated in both routes.

---

## Why these technology choices

| Decision | Why |
|---|---|
| **Backend = Next.js API routes** (not a separate server) | The app is already a Next.js app. API routes *are* the broker — zero new infra. |
| **Official `@anthropic-ai/sdk`** (not raw `fetch`) | Typed requests/responses and typed error classes. The demo used raw `fetch`; the SDK is safer and self-documenting. |
| **`claude-sonnet-4-6`** | The project explicitly chose it (README + handover). Fast + cheap enough for short voice turns. |
| **Supabase JWT for auth** | Same Supabase project the landing app already uses — one identity system, no new vendor. |

---

## File 1 — `lib/anthropic.ts` (the Claude client)

```ts
let client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    client = new Anthropic({ apiKey })
  }
  return client
}
```

**Why lazy (a function, not a top-level `const`):** if we built the client at import time and the key was missing, `next build` would crash just importing the file. Building it on first use means a missing key shows up as a clean runtime error on an actual request instead.

**Why it matters:** `ANTHROPIC_API_KEY` is read from `process.env` on the **server** and never serialized to the client. This single line is the security fix — the key has no path to the browser.

---

## File 2 — `lib/auth.ts` (the gate)

```ts
export async function getUserFromRequest(req: Request): Promise<BrokerUser | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!token) {
    if (process.env.BROKER_DEV_ALLOW_UNAUTH === 'true') return { id: 'dev-user' }
    return null
  }

  const supabase = createClient(url, anonKey)
  const { data, error } = await supabase.auth.getUser(token)   // verifies the JWT
  if (error || !data?.user) return null
  return { id: data.user.id }
}
```

**Why `supabase.auth.getUser(token)`:** it cryptographically verifies the JWT against Supabase — we don't trust a user-supplied ID, we trust a signed token. Returns `null` (not throws) so routes can cleanly answer `401`.

**Why the `BROKER_DEV_ALLOW_UNAUTH` escape hatch:** the voice frontend doesn't issue JWTs yet, so without this you couldn't test the broker at all. It's a **dev-only** bypass, loudly commented, and off by default.

**Why return a tiny `BrokerUser` (`{ id }`) instead of the full Supabase user:** the broker only needs the ID (to look up the Anki endpoint and, later, usage). Keeping the surface small avoids leaking user fields into routes that don't need them.

---

## File 3 — `lib/anki.ts` (per-user routing — the multi-user crux)

```ts
export async function getMcpUrlForUser(_userId: string): Promise<string | null> {
  return process.env.MCP_SERVER_URL ?? null   // TODO: look up anki_links by userId
}
```

**Why this is its own function for a one-liner:** this is *the* hard multi-user problem isolated behind a stable signature. Claude reaches a user's cards through `mcp_servers: [{ url }]`, so "multi-user" literally means "give each user a different URL here." Today it returns one shared demo endpoint; when per-user Anki linking exists, only this function changes — the routes don't.

**Why it takes `userId` even though it ignores it now:** so the call site (`getMcpUrlForUser(user.id)`) is already correct. Swapping the body for a DB lookup later is a one-file change.

---

## File 4 — `app/api/chat/route.ts` (the Claude proxy)

The request lifecycle, in order:

```ts
// 1. Gate
const user = await getUserFromRequest(req)
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 2. Validate input
const messages = body.messages
if (!Array.isArray(messages) || messages.length === 0) return 400

// 3. Resolve THIS user's Anki endpoint
const mcpUrl = await getMcpUrlForUser(user.id)
if (!mcpUrl) return 409  // user hasn't linked Anki

// 4. Proxy with server-held key + the user's MCP endpoint
const response = await getAnthropic().beta.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  betas: ['mcp-client-2025-04-04'],
  system: SYSTEM_PROMPT,
  messages,
  mcp_servers: [{ type: 'url', url: mcpUrl, name: 'anki-mcp' }],
})
```

**Why `beta.messages` + `betas: ['mcp-client-2025-04-04']`:** letting Claude call a remote MCP server (Anki) is a beta feature. The SDK requires the beta namespace and that header to send `mcp_servers`. (This is the one value to suspect if chat 400s — it's flagged in `README.md`.)

**Why the broker — not the browser — supplies `mcp_servers`:** the URL is per-user and resolved from the authenticated identity. If the browser sent it, a user could point Claude at *someone else's* deck. Routing must happen on the trusted server.

**Why `max_tokens: 1024` + the terse system prompt:** voice replies must be short ("under 2 sentences"). The prompt is ported verbatim from the handover so behaviour matches the demo.

**Why the response is filtered:**

```ts
const text = response.content
  .filter((b): b is Anthropic.TextBlock => b.type === 'text')
  .map((b) => b.text)
  .join('')
```

A Claude response is an array of blocks (text, tool calls, etc.). The browser only needs spoken text, so we pull out the text blocks. The `is Anthropic.TextBlock` type guard keeps it type-safe.

**Why typed error handling:**

```ts
if (err instanceof Anthropic.APIError) {
  return NextResponse.json({ error: err.message }, { status: err.status ?? 502 })
}
```

We branch on the SDK's typed error class rather than string-matching messages, and forward Claude's real status code — so a rate-limit or auth failure surfaces accurately instead of a generic 500.

---

## File 5 — `app/api/deepgram-token/route.ts` (the speech token)

```ts
const resp = await fetch('https://api.deepgram.com/v1/auth/grant', {
  method: 'POST',
  headers: { Authorization: `Token ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ ttl_seconds: 30 }),
})
// → returns { access_token, expires_in } to the browser
```

**Why this exists at all:** speech-to-text is a **live WebSocket opened from the browser**, not a request/response we can quietly forward like the Claude call. So we can't hide the key behind a normal proxy.

**The solution:** the server uses the real `DEEPGRAM_API_KEY` to mint a **30-second, transcribe-only token** and hands *that* to the browser. The real key stays server-side; if the temp token leaks it's worthless in seconds.

**Why raw `fetch` here (not an SDK):** it's a single Deepgram REST call; pulling in their SDK for one endpoint isn't worth it.

**The caveat:** this assumes Deepgram exposes `/v1/auth/grant` on our plan. If not, the route returns a clear `502` and the fallback is proxying the audio WebSocket through the broker. (Flagged as an open question in the architecture doc.)

---

## What this deliberately does NOT do yet

These are intentional gaps, with the hooks already in place:

- **Usage metering / billing checks** — step 2/3 of `chat/route.ts` is where an entitlement check (`is this user under quota / paid?`) slots in.
- **Per-user Anki decks** — `getMcpUrlForUser` is the single seam for it.
- **Streaming responses** — replies are short, so we return the full message. Streaming can be added later for snappier playback.
- **Analytics events** — the broker is the right place to emit them (server-side, trustworthy), not yet wired.

---

## TL;DR of the "why"

Every expensive thing now happens on a server that (a) holds the secrets, (b) checks you're logged in, and (c) knows which Anki deck is yours. The browser is reduced to "send text, get text" — which means we can charge for it, rate-limit it, and not leak our keys.
