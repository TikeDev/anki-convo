import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  createDeepgramAgentSettings,
  runDeepgramAgentSmoke,
} from './deepgram-agent-smoke.mjs'

const routeSourcePath = fileURLToPath(
  new URL('../app/api/deepgram-agent-smoke/route.ts', import.meta.url),
)

class FakeWebSocket extends EventEmitter {
  static OPEN = 1
  static instances = []

  readyState = FakeWebSocket.OPEN
  sent = []
  closed = false

  constructor(url, options) {
    super()
    this.url = url
    this.options = options
    FakeWebSocket.instances.push(this)
  }

  send(payload) {
    this.sent.push(payload)
  }

  close() {
    this.closed = true
    this.readyState = 3
  }
}

test('settings payload uses Deepgram managed Anthropic for the smoke LLM', () => {
  const settings = createDeepgramAgentSettings()

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
    model: 'nova-3',
    smart_format: false,
  })
  assert.deepEqual(settings.agent.think.provider, {
    type: 'anthropic',
    model: 'claude-sonnet-4-6',
    temperature: 0.7,
  })
  assert.deepEqual(settings.agent.speak.provider, {
    type: 'deepgram',
    model: 'aura-2-thalia-en',
  })
  assert.match(settings.agent.think.prompt, /under one short sentence/)
})

test('smoke runner waits for Welcome before Settings and waits for SettingsApplied before injection', async () => {
  FakeWebSocket.instances = []

  const resultPromise = runDeepgramAgentSmoke({
    apiKey: 'dg-test-key',
    WebSocketImpl: FakeWebSocket,
    collectAfterInjectMs: 10,
    timeoutMs: 100,
  })

  const socket = FakeWebSocket.instances[0]
  assert.equal(socket.url, 'wss://agent.deepgram.com/v1/agent/converse')
  assert.deepEqual(socket.options.headers, { Authorization: 'Token dg-test-key' })
  assert.deepEqual(socket.sent, [])

  socket.emit('message', JSON.stringify({ type: 'Welcome', request_id: 'req-1' }), false)
  assert.equal(JSON.parse(socket.sent[0]).type, 'Settings')
  assert.equal(socket.sent.length, 1)

  socket.emit('message', JSON.stringify({ type: 'SettingsApplied' }), false)
  assert.deepEqual(JSON.parse(socket.sent[1]), {
    type: 'InjectUserMessage',
    content: 'Say hello in one short sentence.',
  })

  socket.emit(
    'message',
    JSON.stringify({ type: 'ConversationText', role: 'agent', content: 'Hello.' }),
    false,
  )

  const result = await resultPromise

  assert.equal(result.ok, true)
  assert.deepEqual(
    result.events.map((event) => event.type),
    ['Welcome', 'SettingsPrepared', 'SettingsSent', 'SettingsApplied', 'ConversationText'],
  )
  assert.deepEqual(result.events[1], {
    type: 'SettingsPrepared',
    listen_provider: 'deepgram',
    listen_model: 'nova-3',
    think_provider: 'anthropic',
    think_model: 'claude-sonnet-4-6',
    speak_provider: 'deepgram',
    speak_model: 'aura-2-thalia-en',
  })
  assert.equal(socket.closed, true)
})

test('smoke runner reports handler errors when sending Settings throws', async () => {
  class ThrowingWebSocket extends EventEmitter {
    static OPEN = 1
    static instances = []

    readyState = ThrowingWebSocket.OPEN
    closed = false

    constructor(url, options) {
      super()
      this.url = url
      this.options = options
      ThrowingWebSocket.instances.push(this)
    }

    send() {
      throw new Error('send failed')
    }

    close() {
      this.closed = true
      this.readyState = 3
    }
  }

  ThrowingWebSocket.instances = []

  const resultPromise = runDeepgramAgentSmoke({
    apiKey: 'dg-test-key',
    WebSocketImpl: ThrowingWebSocket,
    collectAfterInjectMs: 10,
    timeoutMs: 100,
  })

  const socket = ThrowingWebSocket.instances[0]
  socket.emit('message', JSON.stringify({ type: 'Welcome', request_id: 'req-1' }), false)

  const result = await resultPromise

  assert.equal(result.ok, false)
  assert.equal(result.error, 'send failed')
  assert.deepEqual(result.events.at(-1), { type: 'HandlerError', message: 'send failed' })
  assert.equal(socket.closed, true)
})

test('smoke runner summarizes binary audio events without returning raw audio', async () => {
  FakeWebSocket.instances = []

  const resultPromise = runDeepgramAgentSmoke({
    apiKey: 'dg-test-key',
    WebSocketImpl: FakeWebSocket,
    collectAfterInjectMs: 10,
    timeoutMs: 100,
  })

  const socket = FakeWebSocket.instances[0]
  socket.emit('message', JSON.stringify({ type: 'Welcome', request_id: 'req-1' }), false)
  socket.emit('message', JSON.stringify({ type: 'SettingsApplied' }), false)
  socket.emit('message', Buffer.from([1, 2, 3, 4]), true)

  const result = await resultPromise

  assert.equal(result.ok, true)
  assert.deepEqual(result.events.at(-1), { type: 'Audio', bytes: 4 })
})

test('smoke route disables ws bufferutil before loading ws', () => {
  const source = readFileSync(routeSourcePath, 'utf8')

  assert.doesNotMatch(source, /^import WebSocket from 'ws'/m)
  assert.match(source, /process\.env\.WS_NO_BUFFER_UTIL = '1'/)
  assert.match(source, /await import\('ws'\)/)
})
