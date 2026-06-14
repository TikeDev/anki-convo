export const DEEPGRAM_AGENT_URL: 'wss://agent.deepgram.com/v1/agent/converse'

export type DeepgramAgentSettingsMode = 'smoke' | 'browser-demo'

export type DeepgramAgentSettings = {
  type: 'Settings'
  audio: {
    input: {
      encoding: 'linear16'
      sample_rate: 24000
    }
    output: {
      encoding: 'linear16'
      sample_rate: 24000
      container: 'none'
    }
  }
  agent: Record<string, unknown>
}

export function createDeepgramAgentSettings(options?: {
  mode?: DeepgramAgentSettingsMode
}): DeepgramAgentSettings
