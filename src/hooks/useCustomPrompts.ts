import { useState, useEffect } from 'react'
import type { CustomPrompt } from '@/types/custom-prompt'

export function useCustomPrompts() {
  const [userPrompts, setUserPrompts] = useState<CustomPrompt[]>([])

  useEffect(() => {
    window.electronAPI?.getCustomPrompts?.().then(p => setUserPrompts(p ?? []))
  }, [])

  return { userPrompts }
}
