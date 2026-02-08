import { useState, useCallback } from 'react'
import { getCleanupProvider } from '@/lib/cleanup/provider-factory'
import type { CleanupProviderType } from '@/lib/cleanup/types'

interface UseCleanupReturn {
  cleanup: (rawText: string) => Promise<string>
  isCleaning: boolean
  error: string | null
}

export function useGptCleanup(providerType: CleanupProviderType = 'openai'): UseCleanupReturn {
  const [isCleaning, setIsCleaning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cleanup = useCallback(async (rawText: string): Promise<string> => {
    setIsCleaning(true)
    setError(null)
    try {
      const provider = getCleanupProvider(providerType)
      const cleaned = await provider.cleanup(rawText)
      return cleaned
    } catch (err: any) {
      const message = err?.message ?? 'Cleanup failed'
      setError(message)
      return rawText // Return raw text on failure
    } finally {
      setIsCleaning(false)
    }
  }, [providerType])

  return { cleanup, isCleaning, error }
}
