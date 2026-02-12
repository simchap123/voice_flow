import { useState, useCallback, useRef } from 'react'
import type { RecordingState, TranscriptionResult } from '@/types/transcription'
import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType, GenerationMode, OutputLength } from '@/lib/cleanup/types'
import { detectKeywordTrigger } from '@/lib/cleanup/keyword-detector'
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
  detectedMode: GenerationMode | null
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
  const gpt = useGptCleanup(cleanupProvider)
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

      // Cleanup / Generate phase
      let cleaned = raw
      let generatedMode: GenerationMode | null = null
      setDetectedMode(null)

      if (mode === 'prompt' && raw.trim()) {
        // AI Prompt mode: always generate content
        setState('PROCESSING_CLEANUP')

        if (codeMode) {
          // Code mode overrides everything — generate code
          let instructions = raw
          if (promptRefinementEnabled) instructions = await gpt.refinePrompt(instructions)
          cleaned = await gpt.generateWithTemplate('code', instructions, outputLength)
          generatedMode = 'code'
        } else {
          // Check for keyword triggers to pick the right template (email, code, summary, etc.)
          const trigger = detectKeywordTrigger(raw, keywordTriggersEnabled)
          if (trigger.detected && trigger.triggerType) {
            generatedMode = trigger.triggerType
            let instructions = trigger.contentAfterTrigger
            if (promptRefinementEnabled) instructions = await gpt.refinePrompt(instructions)
            cleaned = await gpt.generateWithTemplate(trigger.triggerType, instructions, outputLength)
          } else {
            // No keyword — general generation with full text as instructions
            let instructions = raw
            if (promptRefinementEnabled) instructions = await gpt.refinePrompt(instructions)
            cleaned = await gpt.generateWithTemplate('general', instructions, outputLength)
            generatedMode = 'general'
          }
        }
      } else if (raw.trim()) {
        // Hold/Toggle/Double-tap modes: dictation with optional keyword triggers
        const trigger = keywordTriggersEnabled ? detectKeywordTrigger(raw, true) : null

        if (trigger?.detected && trigger.triggerType) {
          // Keyword trigger detected — generate content instead of dictating
          setState('PROCESSING_CLEANUP')
          generatedMode = trigger.triggerType
          let instructions = trigger.contentAfterTrigger
          if (promptRefinementEnabled) instructions = await gpt.refinePrompt(instructions)
          cleaned = await gpt.generateWithTemplate(trigger.triggerType, instructions, outputLength)
        } else if (cleanupEnabled) {
          // Normal dictation cleanup
          setState('PROCESSING_CLEANUP')
          cleaned = await gpt.cleanup(raw)
        }
      }

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

      const result: TranscriptionResult = {
        rawText: raw,
        cleanedText: cleaned,
        duration: durationSecs,
        timestamp: Date.now(),
        language,
        wordCount: countWords(cleaned),
        recordingFilename: filename,
      }
      setLastResult(result)
      onComplete?.(result)

      setState('IDLE')
    } catch (err: any) {
      setError(err.message ?? 'Processing failed')
      setState('IDLE')
    }
  }, [state, recorder, whisper, gpt, language, cleanupEnabled, codeMode, keywordTriggersEnabled, outputLength, promptRefinementEnabled, autoCopy, snippets, injectText, onComplete])

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
