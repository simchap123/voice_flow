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

    const result = await this.pipe(float32, {
      language: language === 'auto' ? undefined : language,
      task: 'transcribe',
    })

    if (Array.isArray(result)) {
      return result.map((r) => r.text).join(' ')
    }
    return result.text
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
      this.pipe = await pipeline('automatic-speech-recognition', modelId, {
        dtype: 'q4',
        device: 'wasm',
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

  private async decodeAudioToFloat32(blob: Blob): Promise<Float32Array> {
    const arrayBuffer = await blob.arrayBuffer()
    const audioCtx = new OfflineAudioContext(1, 1, 16000)
    const decoded = await audioCtx.decodeAudioData(arrayBuffer)

    // Resample to 16kHz mono
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000)
    const source = offlineCtx.createBufferSource()
    source.buffer = decoded
    source.connect(offlineCtx.destination)
    source.start()

    const rendered = await offlineCtx.startRendering()
    return rendered.getChannelData(0)
  }
}
