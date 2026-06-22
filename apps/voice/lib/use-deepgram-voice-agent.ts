'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createDeepgramAgentSettings,
  DEEPGRAM_AGENT_URL,
} from './deepgram-agent-settings.mjs'
import { demoDecks, executeDemoAnkiFunction } from './demo-anki-functions.mjs'

type AgentStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'user-speaking'
  | 'thinking'
  | 'rating'
  | 'rated'
  | 'next-card'
  | 'speaking'
  | 'muted'
  | 'error'
  | 'ended'

type TranscriptEntry = {
  id: string
  speaker: 'Agent' | 'You'
  text: string
}

type VoiceMode = 'free-talk' | 'push-to-talk'

type ReviewCard = {
  id: string
  deckName: string
  front: string
  back?: string
  position: number
  total: number
}

type LastCommittedRating = {
  cardId: string
  rating: string
  ratingLabel: string
}

type AudioDevice = {
  deviceId: string
  label: string
}

type DeepgramTokenResponse = {
  access_token?: string
  expires_in?: number
  error?: string
}

type DeepgramEvent = {
  type?: string
  role?: string
  content?: string
  code?: string
  description?: string
  functions?: Array<{
    id?: string
    name?: string
    arguments?: unknown
    input?: unknown
  }>
}

const SAMPLE_RATE = 24000
const START_PROMPT = 'Start a short Anki review session. Sync first, then get decks and present the first due card.'

const initialDeck = demoDecks[0]
const initialCard = initialDeck.cards[0]

function createInitialCard(): ReviewCard {
  return {
    id: initialCard.id,
    deckName: initialDeck.name,
    front: initialCard.front,
    back: initialCard.back,
    position: 1,
    total: initialDeck.cards.length,
  }
}

function statusLabel(status: AgentStatus) {
  switch (status) {
    case 'idle':
      return 'Click Start'
    case 'connecting':
      return 'Connecting'
    case 'listening':
      return 'Listening'
    case 'user-speaking':
      return 'Got it'
    case 'thinking':
      return 'Thinking'
    case 'rating':
      return 'Rating'
    case 'rated':
      return 'Rated'
    case 'next-card':
      return 'Next card'
    case 'speaking':
      return 'Speaking'
    case 'muted':
      return 'Muted'
    case 'error':
      return 'Needs attention'
    case 'ended':
      return 'Session ended'
  }
}

export function useDeepgramVoiceAgent() {
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    {
      id: 'agent-1',
      speaker: 'Agent',
      text: 'Ready for Anki review. Connect when you are ready.',
    },
  ])
  const [currentCard, setCurrentCard] = useState<ReviewCard>(createInitialCard)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [lastCommittedRating, setLastCommittedRating] = useState<LastCommittedRating | null>(null)
  const [isAnswerVisible, setIsAnswerVisible] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voiceMode, setVoiceModeState] = useState<VoiceMode>('free-talk')
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([])
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([])
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState('')
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState('')
  const [micLevel, setMicLevel] = useState(0)

  const socketRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const settingsAppliedRef = useRef(false)
  const mutedRef = useRef(false)
  const playbackTimeRef = useRef(0)
  const playbackSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())
  const transcriptCounterRef = useRef(2)
  const currentCardRef = useRef<ReviewCard>(createInitialCard())
  const lastCommittedRatingRef = useRef<LastCommittedRating | null>(null)

  const appendTranscript = useCallback((speaker: TranscriptEntry['speaker'], text: string) => {
    if (!text.trim()) return
    setTranscript((entries) => [
      ...entries,
      {
        id: `${speaker.toLowerCase()}-${transcriptCounterRef.current++}`,
        speaker,
        text,
      },
    ])
  }, [])

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const devices = await navigator.mediaDevices.enumerateDevices()
    setInputDevices(
      devices
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
        })),
    )
    setOutputDevices(
      devices
        .filter((device) => device.kind === 'audiooutput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${index + 1}`,
        })),
    )
  }, [])

  const stopAudio = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    workletRef.current?.disconnect()
    mediaSourceRef.current?.disconnect()
    analyserRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    workletRef.current = null
    mediaSourceRef.current = null
    analyserRef.current = null
    streamRef.current = null
    setMicLevel(0)
  }, [])

  const stopPlayback = useCallback(() => {
    playbackSourcesRef.current.forEach((source) => {
      try {
        source.stop()
      } catch {
        // Already-ended buffer sources throw if stopped again.
      }
      source.disconnect()
    })
    playbackSourcesRef.current.clear()
    playbackTimeRef.current = 0
  }, [])

  const disconnect = useCallback(() => {
    settingsAppliedRef.current = false
    stopPlayback()
    socketRef.current?.close()
    socketRef.current = null
    stopAudio()
    setIsConnected(false)
    setStatus('ended')
  }, [stopAudio, stopPlayback])

  const playPcmAudio = useCallback((buffer: ArrayBuffer) => {
    const context = audioContextRef.current
    if (!context || buffer.byteLength === 0) return

    const pcm = new Int16Array(buffer)
    const audioBuffer = context.createBuffer(1, pcm.length, SAMPLE_RATE)
    const channel = audioBuffer.getChannelData(0)
    for (let index = 0; index < pcm.length; index += 1) {
      channel[index] = pcm[index] / 0x8000
    }

    const source = context.createBufferSource()
    source.buffer = audioBuffer
    source.connect(context.destination)
    playbackSourcesRef.current.add(source)
    source.onended = () => {
      playbackSourcesRef.current.delete(source)
    }
    const startAt = Math.max(context.currentTime, playbackTimeRef.current)
    source.start(startAt)
    playbackTimeRef.current = startAt + audioBuffer.duration
  }, [])

  const sendJson = useCallback((payload: unknown) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload))
    }
  }, [])

  const commitCurrentCard = useCallback((card: ReviewCard) => {
    if (currentCardRef.current.id !== card.id) {
      setIsAnswerVisible(false)
    }
    currentCardRef.current = card
    setCurrentCard(card)
  }, [])

  const updateCardFromResult = useCallback((name: string, result: Record<string, unknown>) => {
    if (name === 'get_due_cards' && Array.isArray(result.cards) && result.cards.length > 0) {
      const card = result.cards[0] as { id?: string; front?: string; position?: number; total?: number }
      const previous = currentCardRef.current
      commitCurrentCard({
        ...previous,
        id: String(card.id ?? previous.id),
        front: String(card.front ?? previous.front),
        back: undefined,
        position: Number(card.position ?? previous.position),
        total: Number(card.total ?? previous.total),
      })
    }

    if (name === 'present_card' && typeof result.card === 'object' && result.card) {
      const card = result.card as {
        id?: string
        deck_name?: string
        front?: string
        back?: string
        position?: number
        total?: number
      }
      commitCurrentCard({
        id: String(card.id ?? ''),
        deckName: String(card.deck_name ?? 'Demo'),
        front: String(card.front ?? ''),
        back: typeof card.back === 'string' ? card.back : undefined,
        position: Number(card.position ?? 1),
        total: Number(card.total ?? 1),
      })
    }

    if (name === 'rate_card' && result.ok === true) {
      const current = currentCardRef.current
      const cardId = String(result.card_id ?? current.id)
      const ratingLabel = String(result.rating_label ?? result.rating ?? 'Rated')
      const committedRating = {
        cardId,
        rating: String(result.rating ?? ratingLabel),
        ratingLabel,
      }
      const isCorrection = lastCommittedRatingRef.current?.cardId === cardId
      lastCommittedRatingRef.current = committedRating
      setLastCommittedRating(committedRating)
      if (!isCorrection) {
        setReviewedCount((count) => count + 1)
      }

      const nextCard = findDemoCard(String(result.next_card_id ?? ''))
      if (nextCard) {
        commitCurrentCard({
          id: nextCard.card.id,
          deckName: nextCard.deck.name,
          front: nextCard.card.front,
          back: undefined,
          position: nextCard.index + 1,
          total: nextCard.deck.cards.length,
        })
        setStatus('next-card')
      } else {
        setStatus('rated')
      }
    }
  }, [commitCurrentCard])

  const handleFunctionCall = useCallback(
    async (event: DeepgramEvent) => {
      const functions = Array.isArray(event.functions) ? event.functions : []
      for (const fn of functions) {
        const name = fn.name ?? ''
        const args = parseFunctionArgs(fn.arguments ?? fn.input)
        setStatus(name === 'rate_card' ? 'rating' : 'thinking')
        const result = await executeDemoAnkiFunction(name, args)
        updateCardFromResult(name, result)
        sendJson({
          type: 'FunctionCallResponse',
          id: fn.id,
          name,
          content: JSON.stringify(result),
        })
      }
    },
    [sendJson, updateCardFromResult],
  )

  const handleJsonEvent = useCallback(
    (event: DeepgramEvent) => {
      switch (event.type) {
        case 'Welcome':
          sendJson(createDeepgramAgentSettings({ mode: 'browser-demo' }))
          break
        case 'SettingsApplied':
          settingsAppliedRef.current = true
          sendJson({ type: 'InjectUserMessage', content: START_PROMPT })
          setStatus(mutedRef.current ? 'muted' : 'listening')
          break
        case 'ConversationText':
          if (event.role === 'user') {
            appendTranscript('You', event.content ?? '')
          } else if (event.role === 'agent') {
            appendTranscript('Agent', event.content ?? '')
          }
          break
        case 'UserStartedSpeaking':
          setStatus('user-speaking')
          break
        case 'AgentThinking':
          setStatus('thinking')
          break
        case 'AgentStartedSpeaking':
          setStatus('speaking')
          break
        case 'AgentAudioDone':
          setStatus(mutedRef.current ? 'muted' : 'listening')
          break
        case 'FunctionCallRequest':
          void handleFunctionCall(event)
          break
        case 'Warning':
          setError(event.description ?? event.code ?? 'Deepgram warning')
          break
        case 'Error':
          setError(event.description ?? event.code ?? 'Deepgram error')
          setStatus('error')
          break
      }
    },
    [appendTranscript, handleFunctionCall, sendJson],
  )

  const startAudio = useCallback(async () => {
    stopAudio()
    const baseAudioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedInputDeviceId || 'default' },
          ...baseAudioConstraints,
        },
      })
    } catch (err) {
      // Some browsers (Firefox, Safari) don't expose the 'default' device id
      // sentinel and throw OverconstrainedError; fall back to an unconstrained
      // request, but only when we weren't asking for a specific user-picked device.
      if (selectedInputDeviceId || !(err instanceof OverconstrainedError)) throw err
      stream = await navigator.mediaDevices.getUserMedia({ audio: baseAudioConstraints })
    }
    streamRef.current = stream

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    const context = audioContextRef.current ?? new AudioContextCtor()
    audioContextRef.current = context
    if (context.state === 'suspended') {
      await context.resume()
    }

    await context.audioWorklet.addModule('/deepgram-pcm-worklet.js')
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    const worklet = new AudioWorkletNode(context, 'deepgram-pcm-processor')
    source.connect(analyser)
    source.connect(worklet)

    worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const socket = socketRef.current
      if (!settingsAppliedRef.current || mutedRef.current || socket?.readyState !== WebSocket.OPEN) return
      socket.send(event.data)
    }

    const data = new Uint8Array(analyser.frequencyBinCount)
    const animate = () => {
      analyser.getByteFrequencyData(data)
      const average = data.reduce((total, value) => total + value, 0) / Math.max(data.length, 1)
      setMicLevel(mutedRef.current ? 0 : average / 255)
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    mediaSourceRef.current = source
    analyserRef.current = analyser
    workletRef.current = worklet
    await refreshDevices()
  }, [refreshDevices, selectedInputDeviceId, stopAudio])

  const connect = useCallback(async () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return
    if (status === 'connecting') return
    setError(null)
    setStatus('connecting')

    try {
      const tokenResponse = await fetch('/api/deepgram-token', { method: 'POST' })
      const tokenData = (await tokenResponse.json()) as DeepgramTokenResponse
      if (!tokenResponse.ok || !tokenData.access_token) {
        throw new Error(tokenData.error ?? 'Unable to get Deepgram token')
      }

      await startAudio()
      settingsAppliedRef.current = false
      playbackTimeRef.current = 0

      // Deepgram browser auth uses the Sec-WebSocket-Protocol header. The
      // WebSocket constructor maps this array to that header.
      const socket = new WebSocket(DEEPGRAM_AGENT_URL, ['bearer', tokenData.access_token])
      socket.binaryType = 'arraybuffer'
      socketRef.current = socket

      socket.onopen = () => {
        setIsConnected(true)
      }
      socket.onmessage = (message) => {
        if (message.data instanceof ArrayBuffer) {
          playPcmAudio(message.data)
          return
        }
        if (message.data instanceof Blob) {
          void message.data.arrayBuffer().then(playPcmAudio)
          return
        }
        try {
          handleJsonEvent(JSON.parse(String(message.data)) as DeepgramEvent)
        } catch {
          setError('Received an unreadable Deepgram event')
        }
      }
      socket.onerror = () => {
        setError('Deepgram connection failed')
        setStatus('error')
      }
      socket.onclose = () => {
        settingsAppliedRef.current = false
        setIsConnected(false)
        stopAudio()
        setStatus((current) => (current === 'error' ? 'error' : 'ended'))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start voice session'
      setError(message)
      setStatus('error')
      setIsConnected(false)
      stopAudio()
    }
  }, [handleJsonEvent, playPcmAudio, startAudio, status, stopAudio])

  const toggleMute = useCallback(() => {
    setIsMuted((muted) => {
      const next = !muted
      mutedRef.current = next
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !next
      })
      setStatus(next ? 'muted' : isConnected ? 'listening' : 'idle')
      return next
    })
  }, [isConnected])

  const setVoiceMode = useCallback((mode: VoiceMode) => {
    setVoiceModeState(mode)
    if (mode === 'push-to-talk' && !mutedRef.current) {
      mutedRef.current = true
      setIsMuted(true)
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = false
      })
      setStatus('muted')
    }
  }, [])

  const revealAnswer = useCallback(() => {
    setIsAnswerVisible(true)
  }, [])

  const injectText = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      if (isRevealCommand(trimmed)) {
        revealAnswer()
      }
      appendTranscript('You', trimmed)
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        sendJson({ type: 'InjectUserMessage', content: trimmed })
        setStatus('thinking')
      } else {
        appendTranscript('Agent', 'Connect voice mode to send this to the agent.')
      }
    },
    [appendTranscript, revealAnswer, sendJson],
  )

  const setSelectedInput = useCallback(
    (deviceId: string) => {
      setSelectedInputDeviceId(deviceId)
      if (streamRef.current) {
        void startAudio()
      }
    },
    [startAudio],
  )

  const setSelectedOutput = useCallback((deviceId: string) => {
    setSelectedOutputDeviceId(deviceId)
  }, [])

  useEffect(() => {
    mutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    const context = audioContextRef.current
    const sinkTarget = context as AudioContext & {
      setSinkId?: (sinkId: string) => Promise<void>
    }
    if (!selectedOutputDeviceId || !sinkTarget?.setSinkId) return
    void sinkTarget.setSinkId(selectedOutputDeviceId).catch(() => {
      setError('This browser could not switch speakers.')
    })
  }, [selectedOutputDeviceId])

  useEffect(() => {
    void refreshDevices()
    return () => {
      stopPlayback()
      socketRef.current?.close()
      stopAudio()
      void audioContextRef.current?.close()
    }
  }, [refreshDevices, stopAudio, stopPlayback])

  return {
    status,
    statusLabel: statusLabel(status),
    transcript,
    currentCard,
    currentQuestionText: currentCard.front || 'Waiting for the next card.',
    reviewedCount,
    lastCommittedRating,
    isAnswerVisible,
    isMuted,
    isConnected,
    isConnecting: status === 'connecting',
    error,
    voiceMode,
    inputDevices,
    outputDevices,
    selectedInputDeviceId,
    selectedOutputDeviceId,
    micLevel,
    connect,
    disconnect,
    toggleMute,
    revealAnswer,
    setVoiceMode,
    injectText,
    setSelectedInput,
    setSelectedOutput,
  }
}

function isRevealCommand(text: string) {
  return /^reveal(?: the)? answer$/i.test(text.trim())
}

function parseFunctionArgs(value: unknown) {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (typeof value === 'object') return value as Record<string, unknown>
  return {}
}

function findDemoCard(cardId: string) {
  if (!cardId) return null
  for (const deck of demoDecks) {
    const index = deck.cards.findIndex((card) => card.id === cardId)
    if (index !== -1) {
      return {
        deck,
        card: deck.cards[index],
        index,
      }
    }
  }
  return null
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
