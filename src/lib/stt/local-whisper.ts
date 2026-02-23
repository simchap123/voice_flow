import { pipeline, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'
import type { STTProvider } from './types'

type ModelSize = 'tiny' | 'base' | 'small' | 'medium'
type ProgressCallback = (progress: ProgressEvent) => void

export interface ProgressEvent {
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready'
  file?: string
  progress?: number
  loaded?: number
  total?: number
}

const MODEL_IDS: Record<ModelSize, string> = {
  tiny: 'onnx-community/whisper-tiny',
  base: 'onnx-community/whisper-base',
  small: 'onnx-community/whisper-small',
  medium: 'onnx-community/whisper-medium',
}

export class LocalWhisperProvider implements STTProvider {
  name = 'Local Whisper'
  type = 'local' as const

  private pipe: AutomaticSpeechRecognitionPipeline | null = null
  private modelSize: ModelSize = 'base'
  private loadedModelSize: ModelSize | null = null
  private loading = false
  private progressListeners: Set<ProgressCallback> = new Set()

  async transcribe(audio: Blob, language: string): Promise<string> {
    if (!this.pipe) {
      await this.loadModel()
    }
    if (!this.pipe) {
      throw new Error('Failed to load local Whisper model.')
    }

    const float32 = await this.decodeAudioToFloat32(audio)

    // Guard: need at least ~0.1s of audio (1600 samples at 16kHz)
    if (float32.length < 1600) {
      throw new Error('Recording too short — speak for at least a second.')
    }

    // Guard: check if audio is essentially silence (RMS below threshold)
    let sumSquares = 0
    for (let i = 0; i < float32.length; i++) {
      sumSquares += float32[i] * float32[i]
    }
    const rms = Math.sqrt(sumSquares / float32.length)
    if (rms < 0.001) {
      throw new Error('No speech detected — microphone may be muted or too quiet.')
    }

    try {
      const result = await this.pipe(float32, {
        language: language === 'auto' ? undefined : language,
        task: 'transcribe',
      })

      if (Array.isArray(result)) {
        return result.map((r) => r.text).join(' ')
      }
      return result.text
    } catch (err: any) {
      // transformers.js throws "token_ids must be a non-empty array" when model
      // generates zero tokens (very short/quiet audio that passed our guards)
      if (err.message?.includes('token_ids') || err.message?.includes('non-empty array')) {
        throw new Error('Could not transcribe — try speaking louder or longer.')
      }
      throw err
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.pipe !== null
  }

  async loadModel(): Promise<void> {
    if (this.loading) return
    if (this.pipe && this.loadedModelSize === this.modelSize) return

    this.loading = true
    try {
      // Dispose old pipeline if switching models
      if (this.pipe) {
        await this.pipe.dispose()
        this.pipe = null
        this.loadedModelSize = null
      }

      const modelId = MODEL_IDS[this.modelSize]
      const useWebGPU = await this.checkWebGPUSupport()
      console.log(`[VoxGen] Local Whisper using ${useWebGPU ? 'WebGPU' : 'WASM'} backend`)

      this.pipe = await pipeline('automatic-speech-recognition', modelId, {
        dtype: useWebGPU
          ? { encoder_model: 'fp32', decoder_model_merged: 'q4' }
          : 'q4',
        device: useWebGPU ? 'webgpu' : 'wasm',
        progress_callback: (event: ProgressEvent) => {
          for (const cb of this.progressListeners) {
            cb(event)
          }
        },
      })
      this.loadedModelSize = this.modelSize
    } finally {
      this.loading = false
    }
  }

  setModelSize(size: ModelSize) {
    this.modelSize = size
  }

  getModelSize(): ModelSize {
    return this.modelSize
  }

  onProgress(cb: ProgressCallback): () => void {
    this.progressListeners.add(cb)
    return () => {
      this.progressListeners.delete(cb)
    }
  }

  isModelLoaded(): boolean {
    return this.pipe !== null && this.loadedModelSize === this.modelSize
  }

  isModelLoading(): boolean {
    return this.loading
  }

  private async checkWebGPUSupport(): Promise<boolean> {
    try {
      if (!navigator.gpu) return false
      const adapter = await navigator.gpu.requestAdapter()
      return !!adapter
    } catch {
      return false
    }
  }

  private async decodeAudioToFloat32(blob: Blob): Promise<Float32Array> {
    const arrayBuffer = await blob.arrayBuffer()
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Recording is empty — no audio data captured.')
    }

    // Decode compressed audio (WebM/Opus) to raw PCM
    const audioCtx = new OfflineAudioContext(1, 16000, 16000)
    const decoded = await audioCtx.decodeAudioData(arrayBuffer)

    if (decoded.duration === 0 || decoded.length === 0) {
      throw new Error('Recording is empty — no audio data captured.')
    }

    // Resample to 16kHz mono
    const targetLength = Math.max(1, Math.ceil(decoded.duration * 16000))
    const offlineCtx = new OfflineAudioContext(1, targetLength, 16000)
    const source = offlineCtx.createBufferSource()
    source.buffer = decoded
    source.connect(offlineCtx.destination)
    source.start()

    const rendered = await offlineCtx.startRendering()
    return rendered.getChannelData(0)
  }
}
