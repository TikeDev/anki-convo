# anki-convo
An AI voice agent client that lets you review and interact with you Anki cards through natural conversation from on any device.

<img width=80% alt="Screenshot 2026-06-14 at 1 28 46 PM" src="https://github.com/user-attachments/assets/104a481e-2477-486e-9c31-3f266aa7c13f" />


## Tech Stack Summary
| Layer | Tech |
|-------|------|
| Voice UI | React |
| Speech to Text | Deepgram streaming API |
| Text to Speech | Deepgram TTS |
| AI Brain | Claude API (claude-sonnet-4-6) |
| Anki Tools | AnkiMCP MCP server |
| Anki (cloud) | headless-anki on EC2 (Terraform) |
| Anki (local fallback) | Anki Desktop + ngrok |
