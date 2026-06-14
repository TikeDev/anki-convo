class DeepgramPcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.targetSampleRate = 24000
    this.remainder = 0
  }

  process(inputs) {
    const input = inputs[0]?.[0]
    if (!input || input.length === 0) return true

    const ratio = sampleRate / this.targetSampleRate
    const outputLength = Math.floor((input.length + this.remainder) / ratio)
    if (outputLength <= 0) {
      this.remainder += input.length
      return true
    }

    const pcm = new Int16Array(outputLength)
    for (let index = 0; index < outputLength; index += 1) {
      const sourceIndex = Math.floor(index * ratio)
      const sample = Math.max(-1, Math.min(1, input[sourceIndex] ?? 0))
      pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    }

    this.remainder = (input.length + this.remainder) - outputLength * ratio
    this.port.postMessage(pcm.buffer, [pcm.buffer])
    return true
  }
}

registerProcessor('deepgram-pcm-processor', DeepgramPcmProcessor)
