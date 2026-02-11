import type { STTProvider, STTProviderType } from './types'
import { OpenAIWhisperProvider } from './openai-whisper'
import { GroqWhisperProvider } from './groq-whisper'
import { LocalWhisperProvider } from './local-whisper'
import { ManagedSTTProvider } from './managed-stt'

const providers: Map<STTProviderType, STTProvider> = new Map()

// Lazy-initialize singleton providers
function getOrCreateProvider(type: STTProviderType): STTProvider {
  let provider = providers.get(type)
  if (provider) return provider

  switch (type) {
    case 'openai':
      provider = new OpenAIWhisperProvider()
      break
    case 'groq':
      provider = new GroqWhisperProvider()
      break
    case 'local':
      provider = new LocalWhisperProvider()
      break
    case 'managed':
      provider = new ManagedSTTProvider()
      break
    case 'deepgram':
      throw new Error('Deepgram provider not yet available. Coming soon!')
    default:
      throw new Error(`Unknown STT provider: ${type}`)
  }

  providers.set(type, provider)
  return provider
}

export function getSTTProvider(type: STTProviderType): STTProvider {
  return getOrCreateProvider(type)
}

export function initSTTProvider(type: STTProviderType, apiKey: string) {
  const provider = getOrCreateProvider(type)

  if (type === 'openai') {
    ;(provider as OpenAIWhisperProvider).init(apiKey)
  } else if (type === 'groq') {
    ;(provider as GroqWhisperProvider).init(apiKey)
  } else if (type === 'managed') {
    ;(provider as ManagedSTTProvider).init(apiKey) // apiKey is actually the user's email
  }
}

export function getLocalWhisperProvider(): LocalWhisperProvider | null {
  const provider = providers.get('local')
  return provider instanceof LocalWhisperProvider ? provider : null
}

export function getAvailableProviders(): { type: STTProviderType; name: string; requiresKey: boolean }[] {
  return [
    { type: 'local', name: 'Local (Free, Offline)', requiresKey: false },
    { type: 'groq', name: 'Groq Cloud (Fast, Cheap)', requiresKey: true },
    { type: 'openai', name: 'OpenAI Whisper (Premium)', requiresKey: true },
    { type: 'deepgram', name: 'Deepgram (Coming Soon)', requiresKey: true },
  ]
}
