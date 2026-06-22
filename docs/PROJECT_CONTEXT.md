# AnkiConvo — Project Context

A self-contained briefing on what this project is, how it's built, and where it stands. Written so a new agent (or teammate) can get fully oriented, and so slides/visuals can be drawn directly from it.

---

## 1. What it is (elevator pitch)

**AnkiConvo is an AI voice agent that reviews your Anki flashcards with you — hands-free, by talking.** You speak, it quizzes you, evaluates your answers, rates each card, and your progress syncs back to your Anki app on all your devices. Think "ChatGPT voice mode meets Anki."

- **Hackathon origin:** a single `index.html` demo with API keys hardcoded in the browser.
- **Now:** a real multi-tier SaaS architecture (accounts, a secure backend, cloud-hosted Anki).

---

## 2. The core architecture (3 independent tiers)

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER  — the voice UI                                          │
│  https://anki-convo-voice.vercel.app/                             │
└───────────────┬───────────────────────────┬─────────────────────┘
                │ transcript + Supabase JWT  │ live audio (scoped token)
                ▼                             ▼
┌───────────────────────────────────┐   ┌──────────────────────────┐
│  VERCEL — apps/voice               │   │  Deepgram (STT / TTS)     │
│  • Voice UI  +  BROKER (API routes)│   └──────────────────────────┘
│  • Holds secret keys server-side   │
│  • Validates the user (JWT)        │
└───────────────┬───────────────────┘
                │ Claude API call, passing the Anki MCP URL
                ▼
┌───────────────────────────────────┐
│  ANTHROPIC (Claude API)            │
│  Claude's servers dial the MCP URL │──────────┐
└────────────────────────────────────┘          │ ngrok HTTPS
                                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  AWS EC2 — the Anki MCP backend                                    │
│  https://majestic-amusable-gout.ngrok-free.dev → :3141             │
│  headless-anki  →  AnkiConnect  →  ankimcp server  →  AnkiWeb sync  │
└────────────────────────────────────────────────────────────────────┘
```

**Key non-obvious fact for a slide:** the browser and Vercel never talk to EC2 directly — **Anthropic's servers** reach the EC2 box (Claude's MCP connector dials the ngrok URL). The broker just *hands Claude the URL*.

---

## 3. The central design decision: "the broker"

In the demo, the browser held the Anthropic + Deepgram API keys — anyone could steal them and run up the bill. The fix is a **backend broker** (Next.js API routes in `apps/voice`) that sits between the browser and every paid API.

| Concern | How the broker handles it |
|---|---|
| **Security** | API keys live only on the server; browser holds a login token |
| **Accounts** | Validates the user's Supabase JWT on every call |
| **Routing** | Maps the user → their Anki MCP endpoint |
| **Speech (the tricky bit)** | Can't proxy a live WebSocket, so it mints a **30-second scoped Deepgram token** the browser uses directly |

**One-line takeaway:** *every expensive action now happens behind a login check, on a server that holds the secrets — the browser just sends text and gets text back.*

---

## 4. The monorepo

Turborepo + npm workspaces:

| Package | What it is | Deployed to |
|---|---|---|
| `apps/landing` | Marketing site + accounts + Stripe checkout | Vercel |
| `apps/voice` | Voice UI + **broker** (API routes) | Vercel (`anki-convo-voice.vercel.app`) |
| `apps/infra` | Terraform — provisions the EC2 Anki MCP server | AWS |
| `packages/lib` | Shared Supabase/Stripe helpers | — |

---

## 5. What each tier does

### Landing (`apps/landing`)
- Next.js marketing page (hero, features, pricing, light/dark mode).
- **Accounts:** Supabase email/password signup + login, session that persists across reloads, logout. Navbar shows the logged-in user + a "Launch app" button.
- **Payments:** Stripe checkout route exists (monthly + lifetime) — *not yet fully wired* (see §7).

### Voice broker (`apps/voice`)
- `POST /api/chat` — proxies Claude (`claude-sonnet-4-6`) with the Anki MCP connector; injects the server-held key + the user's MCP URL.
- `POST /api/deepgram-token` — mints a short-lived scoped Deepgram token (so the key never reaches the browser).
- Auth gate validates the Supabase JWT on every route.
- **Voice UI itself is not built yet** — the broker is ready and waiting.

### Cloud infra (`apps/infra`)
- Terraform provisions an **Ubuntu EC2 (t3.micro)** running, via Docker, the `headless-anki` image + AnkiConnect + the `ankimcp` server on port **3141**.
- **ngrok** tunnels it to a **permanent free static HTTPS domain**: `https://majestic-amusable-gout.ngrok-free.dev`.
- A `setup.py` helper auto-extracts AnkiWeb sync credentials from a local Anki profile and writes `terraform.tfvars`.

---

## 6. Tech stack

| Layer | Technology |
|---|---|
| Voice UI | Next.js (React) on Vercel |
| Speech-to-text / Text-to-speech | Deepgram (streaming STT + TTS) |
| AI brain | Claude API — `claude-sonnet-4-6` |
| Anki integration | AnkiMCP (Model Context Protocol) server |
| Accounts / auth | Supabase |
| Payments | Stripe |
| Hosting (apps) | Vercel |
| Cloud Anki backend | AWS EC2 + Docker + Terraform |
| Public HTTPS tunnel | ngrok (free static domain) |

---

## 7. Status — done vs. remaining

**✅ Done**
- Cloud Anki MCP server live & internet-reachable (`https://majestic-amusable-gout.ngrok-free.dev`)
- Deepgram voice loop tested working end-to-end
- Accounts: signup / login / persistent session / logout (landing)
- Broker: keys off the client, JWT auth gate, per-user MCP routing, scoped Deepgram tokens
- Monorepo + both apps deploying on Vercel

**🟡 In progress / partial**
- Payments: checkout works, but it isn't tied to a user and there's no Stripe webhook, so paying doesn't yet grant access (entitlement gap)

**⬜ Not started**
- The actual voice UI in `apps/voice` (broker is ready; UI is a "coming soon" placeholder)
- Voice frontend → broker JWT handoff (a few lines, blocked on the UI existing)
- Per-user Anki decks (today everyone shares one demo collection on the single EC2 box)

---

## 8. Key values / URLs (for reference)

| Thing | Value |
|---|---|
| Voice app (frontend) | `https://anki-convo-voice.vercel.app/` |
| MCP server URL (`MCP_SERVER_URL`) | `https://majestic-amusable-gout.ngrok-free.dev` |
| Claude model | `claude-sonnet-4-6` |
| EC2 Anki MCP port | `3141` |
| Broker env needs | `ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY`, `MCP_SERVER_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

---

## 9. Suggested slides / visuals

A deck practically falls out of this doc:

1. **Title / pitch** — "Review your Anki cards by talking to AI." (§1)
2. **The problem** — flashcard review is screen-bound, tedious; voice frees it.
3. **Demo flow** — the 5-step voice turn (§2 diagram), ideally animated hop-by-hop.
4. **Architecture** — the 3-tier diagram (§2). Emphasize the "Claude reaches EC2, not the browser" insight.
5. **Security story** — the broker: "keys never touch the browser" before/after (§3).
6. **Tech stack** — the logo grid (§6 table).
7. **What we built in 6 hours** — the done/remaining checklist (§7).
8. **What's next** — voice UI, payments, per-user decks (§7 remaining).

**Visual motifs that work well:**
- The 3-tier stack diagram (browser → Vercel/broker → Claude → EC2/Anki).
- A "before vs after" on keys: *browser holds keys* ❌ → *broker holds keys* ✅.
- The voice-turn timeline: speak → transcribe → think → review card → speak back.

---

*This document reflects the project state as of the build session. The MCP URL and deployment links are live values — verify the EC2 instance is running before any live demo (the ngrok URL is dead if the instance is stopped).*
