export type CleanupProviderType = 'groq' | 'openai' | 'none'

export interface CleanupProvider {
  name: string
  type: CleanupProviderType
  cleanup(rawText: string): Promise<string>
  isAvailable(): boolean
}

export interface CleanupProviderConfig {
  type: CleanupProviderType
  apiKey?: string
}
