export const DEEPGRAM_AGENT_URL = 'wss://agent.deepgram.com/v1/agent/converse'

const DEFAULT_INJECTED_MESSAGE = 'Say hello in one short sentence.'
const DEFAULT_TIMEOUT_MS = 12_000
const DEFAULT_COLLECT_AFTER_INJECT_MS = 4_000

export function createDeepgramAgentSettings() {
  return {
    type: 'Settings',
    audio: {
      input: {
        encoding: 'linear16',
        sample_rate: 24000,
      },
      output: {
        encoding: 'linear16',
        sample_rate: 24000,
        container: 'none',
      },
    },
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

export async function runDeepgramAgentSmoke({
  apiKey,
  WebSocketImpl,
  injectedMessage = DEFAULT_INJECTED_MESSAGE,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  collectAfterInjectMs = DEFAULT_COLLECT_AFTER_INJECT_MS,
}) {
  if (!apiKey) {
    return { ok: false, error: 'DEEPGRAM_API_KEY is not set', events: [] }
  }
  if (!WebSocketImpl) {
    return { ok: false, error: 'WebSocket implementation is required', events: [] }
  }

  const events = []
  let socket
  let resolved = false
  let sawWelcome = false
  let sawSettingsApplied = false
  let sawAgentOutput = false
  let collectTimer = null

  return new Promise((resolve) => {
    const finish = (ok, error) => {
      if (resolved) return
      resolved = true
      clearTimeout(timeoutTimer)
      clearTimeout(collectTimer)
      if (socket?.readyState === WebSocketImpl.OPEN) {
        socket.close()
      }
      resolve(error ? { ok, error, events } : { ok, events })
    }

    const timeoutTimer = setTimeout(() => {
      if (!sawWelcome) {
        finish(false, 'Timed out waiting for Welcome')
        return
      }
      if (!sawSettingsApplied) {
        finish(false, 'Timed out waiting for SettingsApplied')
        return
      }
      if (!sawAgentOutput) {
        finish(false, 'Timed out waiting for agent output')
        return
      }
      finish(true)
    }, timeoutMs)

    socket = new WebSocketImpl(DEEPGRAM_AGENT_URL, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    })

    socket.on('message', (data, isBinary) => {
      try {
        const event = summarizeSocketMessage(data, isBinary)
        events.push(event)

        if (event.type === 'Welcome') {
          sawWelcome = true
          const settings = createDeepgramAgentSettings()
          events.push(summarizeSettings(settings))
          const sent = sendJson(socket, settings)
          events.push({
            type: 'SettingsSent',
            bytes: sent.bytes,
          })
          return
        }

        if (event.type === 'SettingsApplied') {
          sawSettingsApplied = true
          sendJson(socket, { type: 'InjectUserMessage', content: injectedMessage })
          collectTimer = setTimeout(() => {
            finish(sawAgentOutput, sawAgentOutput ? undefined : 'No agent output received after injection')
          }, collectAfterInjectMs)
          return
        }

        if (isAgentOutputEvent(event)) {
          sawAgentOutput = true
        }

        if (event.type === 'AgentAudioDone') {
          finish(true)
        }

        if (event.type === 'Error') {
          finish(false, event.description ?? event.code ?? 'Deepgram Agent error')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        events.push({ type: 'HandlerError', message })
        finish(false, message)
      }
    })

    socket.on('error', (err) => {
      const message = err instanceof Error ? err.message : String(err)
      finish(false, message)
    })

    socket.on('close', () => {
      if (!resolved && !sawAgentOutput) {
        finish(false, 'Deepgram Agent socket closed before agent output')
      }
    })
  })
}

function sendJson(socket, payload) {
  const text = JSON.stringify(payload)
  socket.send(text)
  return { bytes: Buffer.byteLength(text) }
}

function summarizeSettings(settings) {
  return {
    type: 'SettingsPrepared',
    listen_provider: settings.agent.listen.provider.type,
    listen_model: settings.agent.listen.provider.model,
    think_provider: settings.agent.think.provider.type,
    think_model: settings.agent.think.provider.model,
    speak_provider: settings.agent.speak.provider.type,
    speak_model: settings.agent.speak.provider.model,
  }
}

function summarizeSocketMessage(data, isBinary) {
  if (isBinary) {
    return { type: 'Audio', bytes: byteLength(data) }
  }

  const text = dataToText(data)
  try {
    const parsed = JSON.parse(text)
    return summarizeJsonEvent(parsed)
  } catch {
    return { type: 'UnparseableText', bytes: Buffer.byteLength(text) }
  }
}

function summarizeJsonEvent(event) {
  if (!event || typeof event !== 'object') {
    return { type: 'UnknownJson' }
  }

  switch (event.type) {
    case 'ConversationText':
      return {
        type: event.type,
        role: event.role,
        content: event.content,
      }
    case 'Welcome':
      return {
        type: event.type,
        request_id: event.request_id,
      }
    case 'AgentThinking':
      return {
        type: event.type,
        content: event.content,
      }
    case 'AgentStartedSpeaking':
      return {
        type: event.type,
        total_latency: event.total_latency,
        tts_latency: event.tts_latency,
        ttt_latency: event.ttt_latency,
      }
    case 'Error':
    case 'Warning':
      return {
        type: event.type,
        code: event.code,
        description: event.description,
      }
    case 'FunctionCallRequest':
      return {
        type: event.type,
        functions: Array.isArray(event.functions)
          ? event.functions.map((fn) => ({
              id: fn.id,
              name: fn.name,
              client_side: fn.client_side,
            }))
          : [],
      }
    default:
      return { type: event.type ?? 'UnknownJson' }
  }
}

function isAgentOutputEvent(event) {
  return (
    event.type === 'Audio' ||
    event.type === 'AgentAudioDone' ||
    event.type === 'AgentStartedSpeaking' ||
    event.type === 'AgentThinking' ||
    (event.type === 'ConversationText' && event.role === 'agent')
  )
}

function dataToText(data) {
  if (typeof data === 'string') return data
  if (Buffer.isBuffer(data)) return data.toString('utf8')
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8')
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8')
  }
  return String(data)
}

function byteLength(data) {
  if (typeof data === 'string') return Buffer.byteLength(data)
  if (Buffer.isBuffer(data)) return data.byteLength
  if (data instanceof ArrayBuffer) return data.byteLength
  if (ArrayBuffer.isView(data)) return data.byteLength
  return Buffer.byteLength(String(data))
}
