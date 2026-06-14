# anki-convo
An AI voice agent client that lets you review and interact with you Anki cards through natural conversation from on any device.

Google Doc - https://docs.google.com/document/d/15ioZQSvzYLgLluTZ2r7t8R10qRf5JL60VoKm6BEfUHY/edit?usp=sharing

<img width=80% alt="Screenshot 2026-06-14 at 1 24 01 PM" src="https://github.com/user-attachments/assets/9cc5d7ca-1c01-4fd5-9e40-5fa84eb6701d" />


# Anki Voice — Hackathon Team Doc
**Time: 6 hours | Goal: Working demo we can pitch as a business**

---

## What We're Building
An AI voice agent that reviews your Anki flashcards with you. You talk to it, it quizzes you, your progress syncs back to your Anki app on all your devices. Think Duolingo meets ChatGPT voice mode, but for any subject.

## The Demo We Need to Ship
1. User opens a web page
2. Clicks start, AI greets them and begins a review session
3. User answers cards out loud
4. AI evaluates, rates the card, moves to the next one
5. Progress syncs back to AnkiWeb automatically
6. Show Anki Desktop to prove it worked

That's it. That's what we're demoing.

---

## Team Assignments

### Kerline — Cloud Infrastructure
**Goal: Get the cloud Anki instance synced and serving cards**

The MCP server (the bridge between client and Anki) is built and deployed on EC2, but the Anki collection isn't syncing from AnkiWeb. The fix requires a one-time VNC login to the container.

**Steps:**
1. `terraform apply` in `anki-mcp-cloud/` to spin up a fresh EC2 instance
2. Save `anki-mcp-key.pem` immediately after apply
3. SSH tunnel for VNC: `ssh -i anki-mcp-key.pem -L 5900:localhost:5900 ubuntu@<IP> -N`
4. Connect VNC client: `open vnc://localhost:5900`
5. Log into AnkiWeb in the Anki GUI, hit sync
6. Confirm collection downloads
7. Get ngrok URL: `ssh -i anki-mcp-key.pem ubuntu@<IP> cat /opt/ngrok-url.txt`
8. Share ngrok URL with the engineer building the voice agent

**Fallback (if EC2 takes too long):**
Use the local setup — Anki Desktop open on your Mac + AnkiMCP addon + `ngrok http 3141`. This already works and is good enough for a demo.

**Reference:** See `HANDOVER.md` for full technical context.

---

### Engineer — Voice Agent
**Goal: Build the voice interface**

Single `index.html` file. Push to Claude Code or Cursor with `VOICE_AGENT_HANDOVER.md` as context.

**What to build:**
- Dark UI matching Claude's voice mode aesthetic
- Ambient glow that reacts to mic audio in real time
- Free talk mode (default) + push to talk toggle
- Mute button, settings panel, end session button
- Deepgram streaming STT → Claude API with AnkiMCP → Deepgram TTS
- Audio feedback sounds (earcons) so user always knows what's happening
- Current card displayed on screen (front → flip to back)
- Audio device switching in settings

**Key env vars needed:**
```
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=
MCP_SERVER_URL=  ← get this from KM when EC2 is ready (or use local ngrok)
```

**Reference:** See `VOICE_AGENT_HANDOVER.md` for full specs and code snippets.

---

### Non-Technical Task 1 — Landing Page
**Goal: A page that makes people want to sign up**

Something that looks great.

**What the page needs:**
- Hero: "Review your Anki cards by talking to AI" + "Try Demo" button
- 3 feature bullets: Any subject · Voice-first · Syncs to your Anki
- How it works: 3 steps with icons
- Pricing section (fake for now — "Coming Soon" or waitlist)
- Footer with social links

**Tone:** Clean, minimal, slightly premium. Think Readwise or Linear.

**Domain:** If we have one, point it at the site. If not, use their free subdomain for the demo.

**When done:** Share the URL so we can link to it from social.

---

### Non-Technical Task 2 — Social & Buzz
**Goal: Make us look real and build early interest**

**Twitter/X:**
- Create account: @AnkiConvo (or whatever name we land on)
- Post 3-4 tweets today:
  1. Teaser: "Building something for Anki users 👀 #hackathon #sundai"
  2. Progress: short screen recording of the voice agent working
  3. Demo: clean video of the full flow
  4. CTA: "Want early access? Reply or DM"

**Demo video (most important):**
- 60-90 seconds
- Show the app, talk through a few cards, show Anki Desktop syncing
- Record on your phone or use Loom
- No need to be polished — authentic hackathon energy is fine

**Waitlist:**
- Set up a simple Typeform or Google Form for email signups
- "Join the waitlist" CTA on the landing page and in social posts

---

## Product Name / Branding
We need to decide quickly. Options:
- **Anki Convo** (descriptive, clear)
- **Recall** (clean, memorable)
- **CardIO** (fun, double meaning)

Pick one so the landing page and social can use it.

---

## Tech Stack Summary
| Layer | Tech |
|-------|------|
| Voice UI | HTML/CSS/JS (single file) |
| Speech to Text | Deepgram streaming API |
| AI Brain | Claude API (claude-sonnet-4-6) |
| Anki Tools | AnkiMCP MCP server |
| Text to Speech | Deepgram TTS |
| Anki (cloud) | headless-anki on EC2 (Terraform) |
| Anki (local fallback) | Anki Desktop + ngrok |
| Landing Page | HTML, Framer, Webflow, whatever |
| Payments | Fake pricing page (Stripe later) |
| Waitlist | Typeform or Google Form |

---

## Timeline

| Time | Milestone |
|------|-----------|
| +30 min | Name decided, EC2 spinning up, voice agent scaffolded, landing page started |
| +1.5 hrs | EC2 synced OR local fallback confirmed, voice agent has STT + Claude working |
| +2.5 hrs | Full voice loop working (STT → Claude → TTS), landing page live |
| +3.5 hrs | Polish pass on voice UI, demo video recorded |
| +4.5 hrs | Everything integrated, social posts up, practice demo run |
| +5.5 hrs | Buffer / fixing anything broken |
| +6 hrs | Demo 🚀 |

---

## What We're Probably NOT Building Today
- User accounts or auth
- Per-user Anki instances (demo uses one shared instance)
- Real Stripe integration (just a pricing page)
- Mobile app
- Backend server

---

## Definition of Done
- [ ] Voice agent page loads and works end to end
- [ ] At least 5 cards reviewed in a demo run without breaking
- [ ] Progress visible in Anki Desktop after session
- [ ] Landing page live with waitlist form
- [ ] At least one social post up
- [ ] Demo video recorded
- [ ] We can present this in 3 minutes without anything catching fire

---

## Communication
- Shared ngrok URL: post in group chat when ready
- Any blockers: flag immediately, don't sit on them
- Demo run-through: everyone stops and watches at the 4.5 hour mark
