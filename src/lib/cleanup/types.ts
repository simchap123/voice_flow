export type CleanupProviderType = 'groq' | 'openai' | 'none'

export type GenerationMode = 'email' | 'code' | 'summary' | 'expand' | 'general'

export type OutputLength = 'concise' | 'medium' | 'detailed'

export interface CleanupProvider {
  name: string
  type: CleanupProviderType
  cleanup(rawText: string): Promise<string>
  generate(instructions: string): Promise<string>
  cleanupCode(rawText: string): Promise<string>
  generateWithTemplate(mode: GenerationMode, instructions: string, outputLength: OutputLength): Promise<string>
  refinePrompt(rawInstructions: string): Promise<string>
  isAvailable(): boolean
}

export interface CleanupProviderConfig {
  type: CleanupProviderType
  apiKey?: string
}
