import { useState, useCallback } from 'react'
import { transcribeAudio } from '@/lib/openai'

interface UseWhisperTranscriptionReturn {
  transcribe: (audioBlob: Blob, language?: string) => Promise<string>
  isTranscribing: boolean
  error: string | null
}

export function useWhisperTranscription(): UseWhisperTranscriptionReturn {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transcribe = useCallback(async (audioBlob: Blob, language: string = 'en'): Promise<string> => {
    setIsTranscribing(true)
    setError(null)
    try {
      const text = await transcribeAudio(audioBlob, language)
      return text
    } catch (err: any) {
      const message = err?.message ?? 'Transcription failed'
      setError(message)
      throw err
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  return { transcribe, isTranscribing, error }
}
