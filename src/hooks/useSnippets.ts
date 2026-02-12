import { useState, useEffect, useCallback, useRef } from 'react'
import type { Snippet } from '@/types/snippets'
import { generateId } from '@/lib/audio-utils'

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const isSaving = useRef(false)

  useEffect(() => {
    async function load() {
      if (window.electronAPI) {
        const data = await window.electronAPI.getSnippets()
        setSnippets(data ?? [])
      }
      setIsLoaded(true)
    }
    load()
  }, [])

  // Listen for snippet changes from other windows (e.g. main window → overlay)
  useEffect(() => {
    const cleanup = window.electronAPI?.onSnippetsChanged?.(() => {
      // Skip reload if this window just saved (avoid echo)
      if (isSaving.current) return
      window.electronAPI?.getSnippets().then(data => {
        setSnippets(data ?? [])
      })
    })
    return () => cleanup?.()
  }, [])

  useEffect(() => {
    if (isLoaded && window.electronAPI) {
      isSaving.current = true
      window.electronAPI.setSnippets(snippets).finally(() => {
        // Reset after a short delay to allow the broadcast echo to pass
        setTimeout(() => { isSaving.current = false }, 100)
      })
    }
  }, [snippets, isLoaded])

  const addSnippet = useCallback((trigger: string, expansion: string, description: string = '') => {
    const now = Date.now()
    setSnippets(prev => [
      ...prev,
      { id: generateId(), trigger, expansion, description, createdAt: now, updatedAt: now },
    ])
  }, [])

  const updateSnippet = useCallback((id: string, updates: Partial<Pick<Snippet, 'trigger' | 'expansion' | 'description'>>) => {
    setSnippets(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s))
    )
  }, [])

  const deleteSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id))
  }, [])

  const importSnippets = useCallback((imported: Snippet[]) => {
    setSnippets(prev => [...prev, ...imported])
  }, [])

  const exportSnippets = useCallback(() => {
    const json = JSON.stringify(snippets, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voxgen-snippets-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [snippets])

  return {
    snippets,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    importSnippets,
    exportSnippets,
  }
}
