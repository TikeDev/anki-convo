# Voice App Agent Instructions

## Project Scope

`apps/voice` is the voice agent client for AnkiConvo. The target product is a spoken Anki review session: the user answers cards out loud, the agent reveals answers, captures ratings, and syncs progress back through AnkiMCP.

The checked-in code is placeholder Next.js code from another agent. Do not treat the current UI as a design or architecture source of truth. Use `../../docs/VOICE_AGENT_HANDOVER.md` for product intent, then reconcile it with current Deepgram docs before implementing.

## Current App Shape

- Framework: Next.js 14 App Router, React 18, TypeScript.
- Entry files: `app/layout.tsx`, `app/page.tsx`.
- Package name: `@anki-convo/voice`.
- Local dev script: `pnpm dev` from `apps/voice` if using pnpm, or match the repo's installed package manager until the workspace is cleaned up.
- Default port: `3001`.

Confirm before replacing this app with a different stack. The handoff mentions a single `index.html`, but this directory is already a Next app and browser-visible secrets are not acceptable here.

## Target Architecture

Prefer Deepgram's Voice Agent API for the main build unless we intentionally choose a custom pipeline:

1. Browser captures mic audio and drives UI state, audio level visualization, push-to-talk, mute, and device selection.
2. Browser connects to an app-owned route or temporary-token flow, not directly with long-lived provider keys.
3. Deepgram Voice Agent uses one WebSocket at `wss://agent.deepgram.com/v1/agent/converse`.
4. Send a `Settings` message immediately after opening the socket and before audio.
5. Stream raw audio frames to Deepgram and handle JSON server events plus binary audio output.
6. Use Deepgram function calling for Anki operations. Client-side function calls should hit server routes that relay to AnkiMCP via `MCP_SERVER_URL`.
7. Server-side code owns provider secrets and MCP URLs.

Fallback only if the Voice Agent path blocks the demo: custom Deepgram STT -> Anthropic Messages API with MCP -> Deepgram TTS. If using this fallback, document why in code comments or a short note.

## Deepgram Notes Checked 2026-06-14

- Main Voice Agent overview: https://developers.deepgram.com/docs/voice-agent
- WebSocket reference: https://developers.deepgram.com/reference/voice-agent/voice-agent
- Settings message: https://developers.deepgram.com/docs/voice-agent-settings
- STT models: https://developers.deepgram.com/docs/voice-agent-stt-models
- LLM models: https://developers.deepgram.com/docs/voice-agent-llm-models
- TTS models: https://developers.deepgram.com/docs/voice-agent-tts-models
- Function calling: https://developers.deepgram.com/docs/voice-agents-function-calling

Important current details:

- Voice Agent handles listen, think, and speak over a single WebSocket.
- Auth is `Authorization: Token <DEEPGRAM_API_KEY>` or bearer JWT server-side. Browser WebSockets cannot set arbitrary auth headers; use a temporary token, a server bridge, or the documented WebSocket subprotocol approach. Never expose the long-lived key.
- The WebSocket accepts `Settings`, update messages, injected user/agent messages, keepalive, function call responses, and binary media.
- The WebSocket emits `Welcome`, `SettingsApplied`, `ConversationText`, `UserStartedSpeaking`, `AgentThinking`, `FunctionCallRequest`, `AgentStartedSpeaking`, `AgentAudioDone`, `Error`, `Warning`, `History`, and binary audio.
- Use `agent.listen.provider.version: "v2"` with `flux-general-en` for low-latency voice-agent turns. Nova is broader-feature STT and defaults to V1 behavior.
- Use `agent.think.provider.type: "anthropic"` with `claude-sonnet-4-6` when using Deepgram-managed Anthropic.
- Use Deepgram TTS through `agent.speak.provider.type: "deepgram"` and an Aura 2 voice such as `aura-2-thalia-en` or another verified voice.

## AnkiMCP Contract

The MCP server is expected to expose:

- `sync`
- `get_due_cards`
- `present_card`
- `rate_card`
- `get_decks`

For local demo reliability:

- Anki Desktop must be open with the AnkiMCP addon installed.
- `ngrok http 3141` provides the HTTPS MCP URL.
- Store that value in `MCP_SERVER_URL` on the server only.

## Environment And Secrets

Expected server-side environment variables:

- `DEEPGRAM_API_KEY`
- `ANTHROPIC_API_KEY` if using BYO Anthropic or the custom fallback pipeline
- `MCP_SERVER_URL`

Never hardcode keys in client code, commit `.env`, or publish credentials. Before any commit, verify `.env` is ignored and no secrets are in the diff.

## UX Requirements

- Build the actual voice review experience as the first screen, not a landing page.
- Keep the dark, minimal voice-mode aesthetic from the handoff.
- Show current card content, review progress, and concise state text.
- Support free talk, push to talk, mute, end session, and settings.
- Include microphone and speaker device selection where browser support allows it.
- Use Web Audio API for mic amplitude visualization and short earcons.
- Use Deepgram TTS output for agent speech, not browser `speechSynthesis`.
- Keep spoken agent responses short, natural, and free of markdown.
- Use icons for controls, preferably Lucide if adding an icon dependency.

## Local Browser Rule

Only use Chrome DevTools MCP when explicitly asked to inspect the running browser. For any "running browser" request, attach to the existing Chrome Beta session with `list_pages`; never launch a new browser instance.

## Verification

For meaningful app changes, run the relevant checks before handing off:

- `pnpm lint` or equivalent package-manager command
- `pnpm build` or equivalent package-manager command
- Browser smoke test when UI/audio behavior changes

If browser audio or external services cannot be tested locally, state exactly what was not verified.

