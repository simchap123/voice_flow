import { useState, useEffect, useCallback, useRef } from 'react'
import { getSTTProvider, getLocalWhisperProvider } from '@/lib/stt/provider-factory'
import type { ProgressEvent } from '@/lib/stt/local-whisper'

interface ModelDownloadState {
  isDownloading: boolean
  progress: number
  isReady: boolean
  startDownload: () => void
}

export function useModelDownload(sttProvider: string): ModelDownloadState {
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)

  // Subscribe to progress events when provider is local
  useEffect(() => {
    if (sttProvider !== 'local') {
      setIsDownloading(false)
      setProgress(0)
      setIsReady(false)
      return
    }

    // Ensure provider singleton is created
    getSTTProvider('local')
    const provider = getLocalWhisperProvider()
    if (!provider) return

    // Check current state (preload may already be in progress)
    setIsReady(provider.isModelLoaded())
    setIsDownloading(provider.isModelLoading())

    // Subscribe to progress updates
    const unsub = provider.onProgress((event: ProgressEvent) => {
      if (event.status === 'progress' && event.progress !== undefined) {
        setIsDownloading(true)
        setProgress(Math.round(event.progress))
      }
      if (event.status === 'ready' || event.status === 'done') {
        // Check if fully loaded after each 'done' (multiple files download)
        if (provider.isModelLoaded()) {
          setIsReady(true)
          setIsDownloading(false)
        }
      }
    })
    unsubRef.current = unsub

    return () => {
      unsub()
      unsubRef.current = null
    }
  }, [sttProvider])

  // Poll loading state briefly to catch preload that started before mount
  useEffect(() => {
    if (sttProvider !== 'local') return

    const interval = setInterval(() => {
      const provider = getLocalWhisperProvider()
      if (!provider) return

      if (provider.isModelLoaded()) {
        setIsReady(true)
        setIsDownloading(false)
        clearInterval(interval)
      } else if (provider.isModelLoading()) {
        setIsDownloading(true)
      }
    }, 500)

    // Stop polling after 5 minutes max
    const timeout = setTimeout(() => clearInterval(interval), 5 * 60 * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [sttProvider])

  const startDownload = useCallback(async () => {
    if (sttProvider !== 'local') return
    const provider = getLocalWhisperProvider()
    if (!provider || provider.isModelLoaded() || provider.isModelLoading()) return

    setIsDownloading(true)
    setProgress(0)

    try {
      await provider.loadModel()
      setIsReady(true)
    } catch {
      // Error handled by provider; UI will show not-ready state
    } finally {
      setIsDownloading(false)
    }
  }, [sttProvider])

  return { isDownloading, progress, isReady, startDownload }
}
