import { useState, useCallback, useRef } from 'react'
import type { RecordingState, TranscriptionResult } from '@/types/transcription'
import { useAudioRecorder } from './useAudioRecorder'
import { useWhisperTranscription } from './useWhisperTranscription'
import { useGptCleanup } from './useGptCleanup'
import { useElectronBridge } from './useElectronBridge'
import { expandSnippets } from '@/lib/snippet-engine'
import { countWords } from '@/lib/audio-utils'
import type { Snippet } from '@/types/snippets'

interface UseRecordingStateReturn {
  state: RecordingState
  rawText: string
  cleanedText: string
  duration: number
  analyserNode: AnalyserNode | null
  error: string | null
  startRecording: (deviceId?: string) => void
  stopRecording: () => void
  cancelRecording: () => void
  lastResult: TranscriptionResult | null
}

export function useRecordingState(options: {
  language?: string
  cleanupEnabled?: boolean
  autoCopy?: boolean
  snippets?: Snippet[]
  onComplete?: (result: TranscriptionResult) => void
}): UseRecordingStateReturn {
  const { language = 'en', cleanupEnabled = true, autoCopy = true, snippets = [], onComplete } = options

  const [state, setState] = useState<RecordingState>('IDLE')
  const [rawText, setRawText] = useState('')
  const [cleanedText, setCleanedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<TranscriptionResult | null>(null)

  const recorder = useAudioRecorder()
  const whisper = useWhisperTranscription()
  const gpt = useGptCleanup()
  const { injectText } = useElectronBridge()
  const recordingStartTime = useRef<number>(0)

  const startRecording = useCallback(async (deviceId?: string) => {
    if (state !== 'IDLE' && state !== 'CANCELLED') return
    setError(null)
    setRawText('')
    setCleanedText('')
    try {
      await recorder.startRecording(deviceId)
      recordingStartTime.current = Date.now()
      setState('RECORDING')
    } catch (err: any) {
      setError(err.message ?? 'Failed to start recording')
      setState('IDLE')
    }
  }, [state, recorder])

  const stopRecording = useCallback(async () => {
    if (state !== 'RECORDING') return

    try {
      // Stop recording and get audio blob
      const audioBlob = await recorder.stopRecording()
      if (!audioBlob) {
        setState('IDLE')
        return
      }

      const durationSecs = Math.floor((Date.now() - recordingStartTime.current) / 1000)

      // STT phase
      setState('PROCESSING_STT')
      const raw = await whisper.transcribe(audioBlob, language)
      setRawText(raw)

      // Cleanup phase
      let cleaned = raw
      if (cleanupEnabled && raw.trim()) {
        setState('PROCESSING_CLEANUP')
        cleaned = await gpt.cleanup(raw)
      }

      // Snippet expansion
      if (snippets.length > 0) {
        cleaned = expandSnippets(cleaned, snippets)
      }
      setCleanedText(cleaned)

      // Injection phase
      setState('INJECTING')
      if (autoCopy) {
        await injectText(cleaned)
      }

      const result: TranscriptionResult = {
        rawText: raw,
        cleanedText: cleaned,
        duration: durationSecs,
        timestamp: Date.now(),
        language,
        wordCount: countWords(cleaned),
      }
      setLastResult(result)
      onComplete?.(result)

      setState('IDLE')
    } catch (err: any) {
      setError(err.message ?? 'Processing failed')
      setState('IDLE')
    }
  }, [state, recorder, whisper, gpt, language, cleanupEnabled, autoCopy, snippets, injectText, onComplete])

  const cancelRecording = useCallback(() => {
    recorder.cancelRecording()
    setState('CANCELLED')
    setRawText('')
    setCleanedText('')
    setTimeout(() => setState('IDLE'), 100)
  }, [recorder])

  return {
    state,
    rawText,
    cleanedText,
    duration: recorder.duration,
    analyserNode: recorder.analyserNode,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    lastResult,
  }
}
