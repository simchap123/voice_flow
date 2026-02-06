import { useState, useCallback } from 'react'
import { cleanupTranscription } from '@/lib/openai'

interface UseGptCleanupReturn {
  cleanup: (rawText: string) => Promise<string>
  isCleaning: boolean
  error: string | null
}

export function useGptCleanup(): UseGptCleanupReturn {
  const [isCleaning, setIsCleaning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cleanup = useCallback(async (rawText: string): Promise<string> => {
    setIsCleaning(true)
    setError(null)
    try {
      const cleaned = await cleanupTranscription(rawText)
      return cleaned
    } catch (err: any) {
      const message = err?.message ?? 'Cleanup failed'
      setError(message)
      return rawText // Return raw text on failure
    } finally {
      setIsCleaning(false)
    }
  }, [])

  return { cleanup, isCleaning, error }
}
