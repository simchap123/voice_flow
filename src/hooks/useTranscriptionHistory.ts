import { useState, useEffect, useCallback } from 'react'
import type { HistoryEntry } from '@/types/transcription'
import { generateId } from '@/lib/audio-utils'

export function useTranscriptionHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from electron-store on mount
  useEffect(() => {
    async function load() {
      if (window.electronAPI) {
        const data = await window.electronAPI.getHistory()
        setHistory(data ?? [])
      }
      setIsLoaded(true)
    }
    load()
  }, [])

  // Persist whenever history changes (after initial load)
  useEffect(() => {
    if (isLoaded && window.electronAPI) {
      window.electronAPI.setHistory(history)
    }
  }, [history, isLoaded])

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id'>) => {
    setHistory(prev => [{ ...entry, id: generateId() }, ...prev])
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setHistory(prev => prev.filter(e => e.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const filteredHistory = searchQuery
    ? history.filter(
        e =>
          e.rawText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.cleanedText.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history

  const exportHistory = useCallback(() => {
    const text = history
      .map(e => `[${new Date(e.timestamp).toLocaleString()}]\n${e.cleanedText}\n`)
      .join('\n---\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voiceflow-history-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [history])

  return {
    history: filteredHistory,
    allHistory: history,
    searchQuery,
    setSearchQuery,
    addEntry,
    deleteEntry,
    clearHistory,
    exportHistory,
  }
}
