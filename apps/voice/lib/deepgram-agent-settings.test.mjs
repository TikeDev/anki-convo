import test from 'node:test'
import assert from 'node:assert/strict'

import { createDeepgramAgentSettings } from './deepgram-agent-settings.mjs'

test('browser demo settings use Flux v2 with managed Anthropic, Aura 2, and demo Anki functions', () => {
  const settings = createDeepgramAgentSettings({ mode: 'browser-demo' })

  assert.equal(settings.type, 'Settings')
  assert.deepEqual(settings.audio.input, {
    encoding: 'linear16',
    sample_rate: 24000,
  })
  assert.deepEqual(settings.audio.output, {
    encoding: 'linear16',
    sample_rate: 24000,
    container: 'none',
  })
  assert.deepEqual(settings.agent.listen.provider, {
    type: 'deepgram',
    model: 'flux-general-en',
    version: 'v2',
  })
  assert.equal(settings.agent.think.provider.type, 'anthropic')
  assert.equal(settings.agent.think.provider.model, 'claude-sonnet-4-6')
  assert.equal(settings.agent.speak.provider.type, 'deepgram')
  assert.equal(settings.agent.speak.provider.model, 'aura-2-thalia-en')
  assert.match(settings.agent.think.prompt, /Anki flashcard review assistant/)
  assert.match(settings.agent.think.prompt, /call rate_card immediately/i)
  assert.match(settings.agent.think.prompt, /corrections/i)
  assert.doesNotMatch(settings.agent.think.prompt, /ask for Again, Hard, Good, or Easy/i)
  assert.equal(settings.agent.greeting, 'Ready for Anki review. Say which deck you want to study.')

  const functions = settings.agent.think.functions
  assert.deepEqual(
    functions.map((fn) => fn.name),
    ['sync', 'get_decks', 'get_due_cards', 'present_card', 'rate_card'],
  )
  assert.equal(functions.every((fn) => !('client_side' in fn)), true)
  assert.deepEqual(functions.at(-1).parameters.properties.rating, {
    type: 'string',
    enum: ['again', 'hard', 'good', 'easy', '1', '2', '3', '4'],
    description: 'Rating: 1/again, 2/hard, 3/good, or 4/easy.',
  })
})

test('browser demo function definitions only use documented settings fields', () => {
  const settings = createDeepgramAgentSettings({ mode: 'browser-demo' })

  for (const fn of settings.agent.think.functions) {
    assert.deepEqual(Object.keys(fn).sort(), ['description', 'name', 'parameters'])
    assert.equal(fn.parameters.type, 'object')
    assert.equal(JSON.stringify(fn.parameters).includes('oneOf'), false)
  }
})

test('smoke settings keep the already verified nova-3 diagnostic path', () => {
  const settings = createDeepgramAgentSettings({ mode: 'smoke' })

  assert.deepEqual(settings.agent.listen.provider, {
    type: 'deepgram',
    model: 'nova-3',
    smart_format: false,
  })
  assert.equal(settings.agent.think.provider.type, 'anthropic')
  assert.equal(settings.agent.think.provider.model, 'claude-sonnet-4-6')
  assert.match(settings.agent.think.prompt, /testing a voice agent/)
})
