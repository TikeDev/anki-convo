export const DEEPGRAM_AGENT_URL = 'wss://agent.deepgram.com/v1/agent/converse'

const AUDIO_SETTINGS = {
  input: {
    encoding: 'linear16',
    sample_rate: 24000,
  },
  output: {
    encoding: 'linear16',
    sample_rate: 24000,
    container: 'none',
  },
}

const ANKI_PROMPT = `You are an Anki flashcard review assistant for a voice interface.

IMPORTANT RULES:
- Keep all responses under two short sentences.
- Never use markdown, bullet points, or formatting.
- Start by syncing, then ask which deck to review if no deck was provided.
- Present one card front at a time and wait for the user's answer.
- After the user answers, reveal the back and ask for Again, Hard, Good, or Easy.
- Call rate_card immediately when the user gives a rating.
- Say card progress in a compact form like "Card 2 of 10."
- When all cards are done, sync and end the session warmly.`

const DEMO_FUNCTIONS = [
  {
    name: 'sync',
    description: 'Sync the demo Anki collection before or after review.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_decks',
    description: 'List available Anki decks for the review session.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_due_cards',
    description: 'Get due cards for a deck.',
    parameters: {
      type: 'object',
      properties: {
        deck_name: {
          type: 'string',
          description: 'Deck name to review.',
        },
      },
    },
  },
  {
    name: 'present_card',
    description: 'Present a card by card id.',
    parameters: {
      type: 'object',
      properties: {
        card_id: {
          type: 'string',
          description: 'Card id to present.',
        },
      },
      required: ['card_id'],
    },
  },
  {
    name: 'rate_card',
    description: 'Rate a card using Anki rating values.',
    parameters: {
      type: 'object',
      properties: {
        card_id: {
          type: 'string',
          description: 'Card id to rate.',
        },
        rating: {
          type: 'string',
          enum: ['again', 'hard', 'good', 'easy', '1', '2', '3', '4'],
          description: 'Rating: 1/again, 2/hard, 3/good, or 4/easy.',
        },
      },
      required: ['card_id', 'rating'],
    },
  },
]

export function createDeepgramAgentSettings({ mode = 'smoke' } = {}) {
  if (mode === 'browser-demo') {
    return {
      type: 'Settings',
      audio: AUDIO_SETTINGS,
      agent: {
        language: 'en',
        listen: {
          provider: {
            type: 'deepgram',
            model: 'flux-general-en',
            version: 'v2',
          },
        },
        think: {
          provider: {
            type: 'anthropic',
            model: 'claude-sonnet-4-6',
            temperature: 0.5,
          },
          prompt: ANKI_PROMPT,
          functions: DEMO_FUNCTIONS,
        },
        speak: {
          provider: {
            type: 'deepgram',
            model: 'aura-2-thalia-en',
          },
        },
        greeting: 'Ready for Anki review. Say which deck you want to study.',
      },
    }
  }

  return {
    type: 'Settings',
    audio: AUDIO_SETTINGS,
    agent: {
      language: 'en',
      listen: {
        provider: {
          type: 'deepgram',
          model: 'nova-3',
          smart_format: false,
        },
      },
      think: {
        provider: {
          type: 'anthropic',
          model: 'claude-sonnet-4-6',
          temperature: 0.7,
        },
        prompt: 'You are testing a voice agent. Keep replies under one short sentence.',
      },
      speak: {
        provider: {
          type: 'deepgram',
          model: 'aura-2-thalia-en',
        },
      },
    },
  }
}
