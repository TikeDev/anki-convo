# Anki Voice Agent — Hackathon Build Handover

## What We're Building
A voice-based Anki card review agent. User speaks to it, it quizzes them on their Anki flashcards, and their progress syncs back to AnkiWeb automatically. This is a demo for a potential SaaS product.

---

## The Stack
- **Frontend**: Single HTML file (no framework — hackathon speed)
- **STT**: Deepgram streaming WebSocket API (real-time, with VAD)
- **LLM**: Claude API (claude-sonnet-4-6) with AnkiMCP tools
- **TTS**: Deepgram TTS (aura-asteria-en voice) — NO browser speechSynthesis, quality is too bad for a demo
- **Anki integration**: AnkiMCP MCP server running via ngrok

---

## The MCP Server
Already built and working. Exposes Anki tools via HTTP.

**For demo — use local setup (most reliable):**
- Anki Desktop open on Mac with AnkiMCP addon (ID `124672614`) installed
- Run: `ngrok http 3141`
- Use the ngrok HTTPS URL as `MCP_SERVER_URL`

**Available AnkiMCP tools Claude can call:**
- `sync` — sync collection with AnkiWeb
- `get_due_cards` — get cards due for review
- `present_card` — show a specific card
- `rate_card` — submit review rating (1=Again, 2=Hard, 3=Good, 4=Easy)
- `get_decks` — list available decks

---

## UI Design

### Reference
Matches Claude's voice mode UI (dark, minimal, ambient).

### Layout
```
┌─────────────────────────────┐
│                             │
│   [Current Card — Front]    │  ← white card, subtle shadow
│   [flip animation on reveal]│
│                             │
│      Card 3 of 12           │  ← progress
│                             │
│    "Listening..."           │  ← state text, center screen
│                             │
│  ~~~~~~~~~~~~~~~~~~~~~~~~   │
│  ~  ambient glow blob   ~   │  ← reacts to audio amplitude
│  ~~~~~~~~~~~~~~~~~~~~~~~~   │
│                             │
│  ⚙️          🎤         ✕   │  ← bottom controls
└─────────────────────────────┘
```

### Colors
- Background: near-black `#0d0d0d`
- Ambient glow: blue/purple gradient, bottom of screen
- Card: white with subtle drop shadow
- Text: white primary, gray secondary
- Controls: dark circular buttons

### State Text (center screen)
| State | Text |
|-------|------|
| Idle | "Start talking" |
| Listening | "Listening..." |
| User speaking | "Got it..." |
| Processing | "Thinking..." |
| Claude speaking | "Speaking..." |
| Session complete | "All done! Great work." |

---

## Voice Modes

### Free Talk (default)
- Deepgram streaming WebSocket with VAD (voice activity detection)
- Detects when user stops speaking automatically
- No button to hold — always on

### Push to Talk
- Hold center mic button to speak, release to send
- Toggle between modes in settings panel

### Mute
- Mute button cuts mic without ending session
- Visual indicator when muted (mic icon changes, glow disappears)

---

## Audio Feedback (earcons)
Never let the user wonder if it's listening. Use short sound cues:

| Event | Sound |
|-------|-------|
| Session start | Soft rising chime |
| Started listening | Subtle click |
| Sending to Claude | Short whoosh |
| Claude starts speaking | Soft pop |
| Session end | Soft closing tone |
| Muted | Low thud |
| Unmuted | Click |

Generate these with Web Audio API (no external files needed):
```javascript
function playChime(freq = 440, duration = 0.15) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Usage:
playChime(523); // start listening
playChime(440); // stop listening  
playChime(880); // session start
```

---

## Real-Time Visual Feedback

Use Web Audio API `AnalyserNode` to read microphone amplitude and drive the ambient glow animation:

```javascript
// Set up audio analyser
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaStreamSource(stream);
source.connect(analyser);
analyser.fftSize = 256;

const dataArray = new Uint8Array(analyser.frequencyBinCount);

// Animation loop
function animateGlow() {
  analyser.getByteFrequencyData(dataArray);
  const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
  
  // Drive glow size/opacity with volume (0-255)
  const intensity = volume / 255;
  glowElement.style.opacity = 0.3 + intensity * 0.7;
  glowElement.style.transform = `scale(${1 + intensity * 0.3})`;
  
  requestAnimationFrame(animateGlow);
}
animateGlow();
```

CSS for the ambient glow:
```css
.glow {
  position: fixed;
  bottom: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(99, 102, 241, 0.4), transparent 70%);
  border-radius: 50%;
  transition: opacity 0.1s, transform 0.1s;
  pointer-events: none;
}
```

---

## Audio Device Switching

```javascript
// List available audio devices
async function getAudioDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const mics = devices.filter(d => d.kind === 'audioinput');
  const speakers = devices.filter(d => d.kind === 'audiooutput');
  return { mics, speakers };
}

// Switch microphone
async function switchMic(deviceId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: { exact: deviceId } }
  });
  // reconnect to Deepgram stream
}

// Switch speaker (for TTS audio element)
async function switchSpeaker(deviceId) {
  audioElement.setSinkId(deviceId);
}
```

Put device selectors in the settings panel (gear icon bottom left).

---

## Deepgram Integration

### STT — Streaming (Free Talk mode)
```javascript
const ws = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&language=en&punctuate=true&vad_events=true&endpointing=500', 
  ['token', DEEPGRAM_API_KEY]);

ws.onopen = () => {
  // Start sending mic audio chunks
  mediaRecorder.ondataavailable = e => ws.send(e.data);
  mediaRecorder.start(250); // send every 250ms
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'SpeechStarted') {
    updateState('listening');
  }
  if (data.type === 'Results' && data.is_final) {
    const transcript = data.channel.alternatives[0].transcript;
    if (transcript) sendToClaude(transcript);
  }
};
```

### TTS — Deepgram
```javascript
async function speak(text) {
  updateState('speaking');
  const response = await fetch(
    'https://api.deepgram.com/v1/speak?model=aura-asteria-en',
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    }
  );
  const blob = await response.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  audio.onended = () => updateState('listening');
  audio.play();
}
```

---

## Claude API with AnkiMCP

```javascript
const conversationHistory = [];

async function sendToClaude(userMessage) {
  updateState('thinking');
  conversationHistory.push({ role: 'user', content: userMessage });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': ANTHROPIC_API_KEY
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are an Anki flashcard review assistant for a voice interface.
        
        IMPORTANT RULES:
        - Keep ALL responses under 2 sentences. This is voice, not text.
        - Never use markdown, bullet points, or formatting.
        - Never say "I'll" or "Let me" — just do it and report what happened.
        - Start the session by syncing, then get due cards from the user's deck.
        - Present card fronts one at a time, wait for the user's answer.
        - After they answer, reveal the back and ask them to rate: Again, Hard, Good, or Easy.
        - Call rate_card immediately when they give a rating.
        - Say "Card X of Y" when presenting each card.
        - When all cards are done, sync and end the session warmly.`,
      messages: conversationHistory,
      mcp_servers: [{
        type: 'url',
        url: MCP_SERVER_URL,
        name: 'anki-mcp'
      }]
    })
  });

  const data = await response.json();
  const reply = data.content.find(b => b.type === 'text')?.text || '';
  conversationHistory.push({ role: 'assistant', content: reply });
  await speak(reply);
}
```

---

## Bottom Controls

```
[⚙️ Settings]          [🎤 Mic / Mute]          [✕ End]
```

- **Settings (left)**: opens panel with free talk / push to talk toggle + audio device selectors
- **Mic/Mute (center)**: 
  - Free talk mode: toggles mute
  - Push to talk mode: hold to speak
- **End (right)**: ends session, syncs progress

---

## Settings Panel
Slides up from bottom:
- Voice mode: Free Talk / Push to Talk (toggle)
- Microphone: dropdown of available mics
- Speaker: dropdown of available speakers
- (future: deck selector, language)

---

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
DEEPGRAM_API_KEY=...
MCP_SERVER_URL=https://<ngrok-url>
```

For hackathon: hardcode these in the HTML file.

---

## File Structure
```
voice-agent/
└── index.html    # Everything in one file
```

---

## Demo Flow Script
1. Open page — dark screen, "Start talking"
2. User says "Let's review my Spanish cards"
3. Claude syncs, gets due cards, presents card 1
4. User answers out loud
5. Claude reveals answer, asks for rating
6. User says "Good"
7. Claude rates card, moves to card 2
8. After a few cards: "And all of this progress just synced back to my Anki app"
9. Open Anki Desktop to prove it

---

## Time Budget
- 20 min: HTML skeleton + bottom controls UI
- 20 min: Mic access + audio analyser + glow animation
- 20 min: Earcon sounds with Web Audio API
- 30 min: Deepgram streaming STT working
- 30 min: Claude API + MCP connected
- 30 min: Deepgram TTS working
- 20 min: Settings panel + device switching
- 20 min: Card display UI + flip animation
- 30 min: Polish + demo run-through

Total: ~3.5 hours

---

## Docs
- Deepgram streaming STT: https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio
- Deepgram TTS: https://developers.deepgram.com/docs/text-to-speech
- Deepgram VAD events: https://developers.deepgram.com/docs/voice-activity-detection
- Anthropic API + MCP: https://docs.anthropic.com/en/docs/agents-and-tools/mcp
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

## Icons
Use **Lucide Icons** — no generic browser icons.

```html
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>

<!-- Usage -->
<i data-lucide="mic"></i>
<i data-lucide="mic-off"></i>
<i data-lucide="settings"></i>
<i data-lucide="x"></i>
<i data-lucide="sun"></i>
<i data-lucide="moon"></i>
<i data-lucide="volume-2"></i>
<i data-lucide="volume-x"></i>
<i data-lucide="rotate-ccw"></i>
```

---

## Dark / Light Mode

Toggle button in **top left corner** (sun/moon icon). Default is dark mode.

```css
/* Dark mode (default) */
:root {
  --bg: #0d0d0d;
  --bg-secondary: #1a1a1a;
  --card-bg: #ffffff;
  --card-text: #111111;
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --glow-color: rgba(99, 102, 241, 0.4);
  --control-bg: rgba(255,255,255,0.1);
  --control-hover: rgba(255,255,255,0.15);
}

/* Light mode */
[data-theme="light"] {
  --bg: #f5f5f0;
  --bg-secondary: #ebebeb;
  --card-bg: #1a1a1a;
  --card-text: #ffffff;
  --text-primary: #111111;
  --text-secondary: #666666;
  --glow-color: rgba(99, 102, 241, 0.2);
  --control-bg: rgba(0,0,0,0.08);
  --control-hover: rgba(0,0,0,0.12);
}

/* Smooth transition */
*, *::before, *::after {
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}
```

```javascript
// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
let isDark = true;

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  // swap icon
  themeToggle.innerHTML = isDark 
    ? '<i data-lucide="moon"></i>' 
    : '<i data-lucide="sun"></i>';
  lucide.createIcons();
});
```

**Top bar layout:**
```
[🌙 theme]                    [logo/name]
```
