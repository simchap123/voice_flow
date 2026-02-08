export type STTProviderType = 'local' | 'groq' | 'openai' | 'deepgram'

export interface STTProvider {
  name: string
  type: STTProviderType
  transcribe(audio: Blob, language: string): Promise<string>
  isAvailable(): Promise<boolean>
}

export interface STTProviderConfig {
  type: STTProviderType
  apiKey?: string
  localModelSize?: 'tiny' | 'base' | 'small' | 'medium'
}
