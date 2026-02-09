import { useState, useCallback, useRef } from 'react'
import type { RecordingState, TranscriptionResult } from '@/types/transcription'
import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType } from '@/lib/cleanup/types'
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
  startRecording: (deviceId?: string, mode?: string) => void
  stopRecording: () => void
  cancelRecording: () => void
  lastResult: TranscriptionResult | null
}

export function useRecordingState(options: {
  language?: string
  cleanupEnabled?: boolean
  autoCopy?: boolean
  snippets?: Snippet[]
  sttProvider?: STTProviderType
  cleanupProvider?: CleanupProviderType
  codeMode?: boolean
  onComplete?: (result: TranscriptionResult) => void
}): UseRecordingStateReturn {
  const {
    language = 'en',
    cleanupEnabled = true,
    autoCopy = true,
    snippets = [],
    sttProvider = 'openai',
    cleanupProvider = 'openai',
    codeMode = false,
    onComplete,
  } = options

  const [state, setState] = useState<RecordingState>('IDLE')
  const [rawText, setRawText] = useState('')
  const [cleanedText, setCleanedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<TranscriptionResult | null>(null)

  const recorder = useAudioRecorder()
  const whisper = useWhisperTranscription(sttProvider)
  const gpt = useGptCleanup(cleanupProvider)
  const { injectText } = useElectronBridge()
  const recordingStartTime = useRef<number>(0)
  const recordingModeRef = useRef<string | undefined>(undefined)

  const startRecording = useCallback(async (deviceId?: string, mode?: string) => {
    if (state !== 'IDLE' && state !== 'CANCELLED') return
    setError(null)
    setRawText('')
    setCleanedText('')
    recordingModeRef.current = mode
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
      const audioBlob = await recorder.stopRecording()
      if (!audioBlob) {
        setState('IDLE')
        return
      }

      const durationSecs = Math.floor((Date.now() - recordingStartTime.current) / 1000)
      const mode = recordingModeRef.current

      // STT phase
      setState('PROCESSING_STT')
      const raw = await whisper.transcribe(audioBlob, language)
      setRawText(raw)

      // Cleanup / Generate / Code phase
      let cleaned = raw
      if (mode === 'prompt' && raw.trim()) {
        // AI Prompt mode: generate content from spoken instructions
        setState('PROCESSING_CLEANUP')
        cleaned = await gpt.generate(raw)
      } else if (codeMode && raw.trim()) {
        // Code mode: convert spoken instructions to code
        setState('PROCESSING_CLEANUP')
        cleaned = await gpt.cleanupCode(raw)
      } else if (cleanupEnabled && raw.trim()) {
        setState('PROCESSING_CLEANUP')
        cleaned = await gpt.cleanup(raw)
      }

      // Snippet expansion (skip for prompt mode — generated content shouldn't be snippet-expanded)
      if (mode !== 'prompt' && snippets.length > 0) {
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
  }, [state, recorder, whisper, gpt, language, cleanupEnabled, codeMode, autoCopy, snippets, injectText, onComplete])

  const cancelRecording = useCallback(() => {
    recorder.cancelRecording()
    setState('CANCELLED')
    setRawText('')
    setCleanedText('')
    recordingModeRef.current = undefined
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
