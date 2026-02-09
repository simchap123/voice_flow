import type { CleanupProvider, CleanupProviderType } from './types'
import { OpenAICleanupProvider } from './openai-cleanup'
import { GroqCleanupProvider } from './groq-cleanup'

const providers: Map<CleanupProviderType, CleanupProvider> = new Map()

function getOrCreateProvider(type: CleanupProviderType): CleanupProvider {
  let provider = providers.get(type)
  if (provider) return provider

  switch (type) {
    case 'openai':
      provider = new OpenAICleanupProvider()
      break
    case 'groq':
      provider = new GroqCleanupProvider()
      break
    case 'none':
      // No-op provider that returns text as-is
      provider = {
        name: 'None',
        type: 'none',
        cleanup: async (text: string) => text,
        generate: async (text: string) => text,
        cleanupCode: async (text: string) => text,
        isAvailable: () => true,
      }
      break
    default:
      throw new Error(`Unknown cleanup provider: ${type}`)
  }

  providers.set(type, provider)
  return provider
}

export function getCleanupProvider(type: CleanupProviderType): CleanupProvider {
  return getOrCreateProvider(type)
}

export function initCleanupProvider(type: CleanupProviderType, apiKey: string) {
  const provider = getOrCreateProvider(type)

  if (type === 'openai') {
    ;(provider as OpenAICleanupProvider).init(apiKey)
  } else if (type === 'groq') {
    ;(provider as GroqCleanupProvider).init(apiKey)
  }
}

export function getAvailableCleanupProviders(): { type: CleanupProviderType; name: string; requiresKey: boolean }[] {
  return [
    { type: 'groq', name: 'Groq Llama (Fast, Cheap)', requiresKey: true },
    { type: 'openai', name: 'OpenAI GPT-4o-mini', requiresKey: true },
    { type: 'none', name: 'Disabled (Raw Transcription)', requiresKey: false },
  ]
}
