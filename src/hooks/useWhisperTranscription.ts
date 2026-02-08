import { useState, useCallback } from 'react'
import { getSTTProvider } from '@/lib/stt/provider-factory'
import type { STTProviderType } from '@/lib/stt/types'

interface UseTranscriptionReturn {
  transcribe: (audioBlob: Blob, language?: string) => Promise<string>
  isTranscribing: boolean
  error: string | null
}

export function useWhisperTranscription(providerType: STTProviderType = 'openai'): UseTranscriptionReturn {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transcribe = useCallback(async (audioBlob: Blob, language: string = 'en'): Promise<string> => {
    setIsTranscribing(true)
    setError(null)
    try {
      const provider = getSTTProvider(providerType)
      const text = await provider.transcribe(audioBlob, language)
      return text
    } catch (err: any) {
      const message = err?.message ?? 'Transcription failed'
      setError(message)
      throw err
    } finally {
      setIsTranscribing(false)
    }
  }, [providerType])

  return { transcribe, isTranscribing, error }
}
