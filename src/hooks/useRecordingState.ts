import { useState, useCallback, useRef } from 'react'
import type { RecordingState, TranscriptionResult } from '@/types/transcription'
import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType, GenerationMode, OutputLength } from '@/lib/cleanup/types'
import { runCleanupPipeline, type PipelineOptions } from '@/lib/cleanup/pipeline'
import { useAudioRecorder } from './useAudioRecorder'
import { useWhisperTranscription } from './useWhisperTranscription'
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
  detectedMode: GenerationMode | null
  startRecording: (deviceId?: string, mode?: string) => void
  stopRecording: () => void
  cancelRecording: () => void
  clearError: () => void
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
  keywordTriggersEnabled?: boolean
  outputLength?: OutputLength
  promptRefinementEnabled?: boolean
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
    keywordTriggersEnabled = true,
    outputLength = 'medium',
    promptRefinementEnabled = false,
    onComplete,
  } = options

  const [state, setState] = useState<RecordingState>('IDLE')
  const [rawText, setRawText] = useState('')
  const [cleanedText, setCleanedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<TranscriptionResult | null>(null)
  const [detectedMode, setDetectedMode] = useState<GenerationMode | null>(null)

  const recorder = useAudioRecorder()
  const whisper = useWhisperTranscription(sttProvider)
  const { injectText } = useElectronBridge()
  const recordingStartTime = useRef<number>(0)
  const recordingModeRef = useRef<string | undefined>(undefined)

  const startRecording = useCallback(async (deviceId?: string, mode?: string) => {
    if (state !== 'IDLE' && state !== 'CANCELLED') return
    setError(null)
    setRawText('')
    setCleanedText('')
    setDetectedMode(null)
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

      // Save recording to disk (fire-and-forget, parallel with STT)
      const filename = `recording-${Date.now()}.webm`
      audioBlob.arrayBuffer().then(buffer => {
        window.electronAPI?.saveRecording(filename, buffer).catch((err: any) =>
          console.warn('[VoxGen] Failed to save recording:', err)
        )
      })

      // STT phase
      setState('PROCESSING_STT')
      const raw = await whisper.transcribe(audioBlob, language)
      setRawText(raw)

      // Cleanup phase — now runs through the multi-stage pipeline
      setState('PROCESSING_CLEANUP')

      const pipelineOptions: PipelineOptions = {
        cleanupProvider,
        cleanupEnabled,
        fillerWordRemoval: false,     // TODO: wire to settings when UI is added
        autoFormatParagraphs: true,
        keywordTriggersEnabled,
        promptRefinementEnabled,
        codeMode,
        outputLength,
        mode,
        wordReplacements: [],         // TODO: wire to settings when UI is added
        // context: { clipboard, windowTitle, etc. }  // TODO: Phase 2
      }

      const result = await runCleanupPipeline(raw, pipelineOptions)
      let cleaned = result.text
      const generatedMode = result.detectedMode

      setDetectedMode(generatedMode)

      // Snippet expansion (skip for generated content — only expand in pure dictation)
      if (!generatedMode && snippets.length > 0) {
        cleaned = expandSnippets(cleaned, snippets)
      }
      setCleanedText(cleaned)

      // Injection phase
      setState('INJECTING')
      if (autoCopy) {
        await injectText(cleaned)
      }

      const transcriptionResult: TranscriptionResult = {
        rawText: raw,
        cleanedText: cleaned,
        duration: durationSecs,
        timestamp: Date.now(),
        language,
        wordCount: countWords(cleaned),
        recordingFilename: filename,
      }
      setLastResult(transcriptionResult)
      onComplete?.(transcriptionResult)

      setState('IDLE')
    } catch (err: any) {
      setError(err.message ?? 'Processing failed')
      setState('IDLE')
    }
  }, [state, recorder, whisper, language, cleanupEnabled, cleanupProvider, codeMode, keywordTriggersEnabled, outputLength, promptRefinementEnabled, autoCopy, snippets, injectText, onComplete])

  const cancelRecording = useCallback(() => {
    recorder.cancelRecording()
    setState('CANCELLED')
    setRawText('')
    setCleanedText('')
    setDetectedMode(null)
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
    detectedMode,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError: () => setError(null),
    lastResult,
  }
}
