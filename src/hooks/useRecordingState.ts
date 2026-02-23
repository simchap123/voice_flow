import { useState, useCallback, useRef } from 'react'
import type { RecordingState, TranscriptionResult } from '@/types/transcription'
import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType, GenerationMode, OutputLength } from '@/lib/cleanup/types'
import { runCleanupPipeline, type PipelineOptions } from '@/lib/cleanup/pipeline'
import { filterTranscript } from '@/lib/cleanup/transcript-filter'
import { getPromptById } from '@/lib/cleanup/predefined-prompts'
import type { CustomPrompt } from '@/types/custom-prompt'
import type { PowerMode } from '@/types/power-mode'
import { matchPowerMode } from '@/lib/power-modes/matcher'
import { getSTTProvider } from '@/lib/stt/provider-factory'
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
  matchedMode: { name: string; emoji: string } | null
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
  fillerWordRemoval?: boolean
  useClipboardContext?: boolean
  useWindowContext?: boolean
  customVocabulary?: string[]
  wordReplacements?: Array<{ original: string; replacement: string; enabled: boolean }>
  activePromptId?: string
  userPrompts?: CustomPrompt[]
  powerModes?: PowerMode[]
  powerModesEnabled?: boolean
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
    fillerWordRemoval = false,
    useClipboardContext = true,
    useWindowContext = true,
    customVocabulary = [],
    wordReplacements = [],
    activePromptId = 'default',
    userPrompts = [],
    powerModes = [],
    powerModesEnabled = false,
    onComplete,
  } = options

  const [state, setState] = useState<RecordingState>('IDLE')
  const [rawText, setRawText] = useState('')
  const [cleanedText, setCleanedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<TranscriptionResult | null>(null)
  const [detectedMode, setDetectedMode] = useState<GenerationMode | null>(null)
  const [matchedMode, setMatchedMode] = useState<{ name: string; emoji: string } | null>(null)

  const recorder = useAudioRecorder()
  const whisper = useWhisperTranscription(sttProvider)
  const { injectText } = useElectronBridge()
  const recordingStartTime = useRef<number>(0)
  const recordingModeRef = useRef<string | undefined>(undefined)
  // Phase 2: context captured at recording start
  const capturedClipboard = useRef<string | undefined>(undefined)
  const capturedWindowInfo = useRef<{ processName: string; title: string } | null | undefined>(undefined)

  const startRecording = useCallback(async (deviceId?: string, mode?: string) => {
    if (state !== 'IDLE' && state !== 'CANCELLED') return
    setError(null)
    setRawText('')
    setCleanedText('')
    setDetectedMode(null)
    recordingModeRef.current = mode
    capturedClipboard.current = undefined
    capturedWindowInfo.current = undefined

    // Phase 2: capture context ONLY when needed — skip entirely for regular dictation
    // Clipboard: only useful in prompt mode (pipeline ignores it for regular cleanup)
    // Window info: needed in prompt mode OR when power modes are enabled (for app matching)
    const isPromptMode = mode === 'prompt'
    const needsClipboard = isPromptMode && useClipboardContext
    const needsWindowInfo = (isPromptMode && useWindowContext) || powerModesEnabled

    const contextCaptures: Promise<void>[] = []

    if (needsClipboard && window.electronAPI?.readClipboard) {
      contextCaptures.push(
        window.electronAPI.readClipboard()
          .then(text => { capturedClipboard.current = text || undefined })
          .catch((err: any) => { console.debug('[VoxGen] Clipboard read failed:', err?.message) })
      )
    }

    if (needsWindowInfo && window.electronAPI?.getActiveWindowInfo) {
      contextCaptures.push(
        window.electronAPI.getActiveWindowInfo()
          .then(info => { capturedWindowInfo.current = info })
          .catch((err: any) => { console.debug('[VoxGen] Window info failed:', err?.message) })
      )
    }

    // Only await if there are captures — regular dictation starts instantly
    if (contextCaptures.length > 0) {
      await Promise.race([
        Promise.all(contextCaptures),
        new Promise<void>(resolve => setTimeout(resolve, 500)),
      ]).catch(() => {})
    }

    try {
      await recorder.startRecording(deviceId)
      recordingStartTime.current = Date.now()
      setState('RECORDING')
    } catch (err: any) {
      setError(err.message ?? 'Failed to start recording')
      setState('IDLE')
    }
  }, [state, recorder, useClipboardContext, useWindowContext, powerModesEnabled])

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

      // Phase 4: apply power mode overrides if a mode matches the captured window
      let effectivePromptId = activePromptId
      let effectiveStt = sttProvider
      let effectiveCleanup = cleanupProvider
      if (powerModesEnabled && capturedWindowInfo.current) {
        const matched = matchPowerMode(capturedWindowInfo.current, powerModes)
        if (matched) {
          effectivePromptId = matched.selectedPromptId
          if (matched.sttProvider) effectiveStt = matched.sttProvider as STTProviderType
          if (matched.cleanupProvider) effectiveCleanup = matched.cleanupProvider as CleanupProviderType
          setMatchedMode({ name: matched.name, emoji: matched.emoji })
        } else {
          setMatchedMode(null)
        }
      }

      // STT phase — use effectiveStt (may be overridden by power mode)
      setState('PROCESSING_STT')
      const raw = effectiveStt !== sttProvider
        ? await getSTTProvider(effectiveStt).transcribe(audioBlob, language)
        : await whisper.transcribe(audioBlob, language)
      setRawText(raw)

      // Cleanup phase — only show state if cleanup is actually enabled with a real provider
      if (cleanupEnabled && cleanupProvider !== 'none') {
        setState('PROCESSING_CLEANUP')
      }

      // Build Phase 2 context from captures at recording start
      const context: PipelineOptions['context'] = {}
      if (capturedClipboard.current?.trim()) {
        context.clipboard = capturedClipboard.current
      }
      if (capturedWindowInfo.current) {
        context.windowTitle = capturedWindowInfo.current.title
        context.windowProcess = capturedWindowInfo.current.processName
      }
      if (customVocabulary.length > 0) {
        context.customVocabulary = customVocabulary
      }

      // Phase 3: look up active prompt instructions
      const activePrompt = getPromptById(effectivePromptId, userPrompts)
      const customPromptInstructions = activePrompt?.promptText
      const useSystemInstructions = activePrompt?.useSystemInstructions ?? true

      const pipelineOptions: PipelineOptions = {
        cleanupProvider: effectiveCleanup,
        cleanupEnabled,
        fillerWordRemoval,
        autoFormatParagraphs: true,
        keywordTriggersEnabled,
        promptRefinementEnabled,
        codeMode,
        outputLength,
        mode,
        wordReplacements,
        context: Object.keys(context).length > 0 ? context : undefined,
        customPromptInstructions,
        useSystemInstructions,
      }

      let cleaned = raw
      let generatedMode: GenerationMode | null = null

      try {
        const result = await Promise.race([
          runCleanupPipeline(raw, pipelineOptions),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI cleanup timed out after 30s')), 30000)
          ),
        ])
        cleaned = result.text
        generatedMode = result.detectedMode ?? null
      } catch (cleanupErr: any) {
        const msg = cleanupErr.message?.toLowerCase() ?? ''
        const isNetworkError = msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('timed out') || msg.includes('enotfound') || msg.includes('econnrefused')
        if (isNetworkError) {
          // Cleanup failed due to network — use raw text with hallucination filter
          cleaned = filterTranscript(raw)
          console.warn('[VoxGen] Cleanup failed (network), using raw text:', cleanupErr.message)
        } else {
          throw cleanupErr
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
  }, [state, recorder, whisper, language, cleanupEnabled, cleanupProvider, sttProvider, codeMode, keywordTriggersEnabled, outputLength, promptRefinementEnabled, fillerWordRemoval, wordReplacements, customVocabulary, autoCopy, snippets, injectText, onComplete, activePromptId, userPrompts, powerModes, powerModesEnabled])

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
    matchedMode,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError: () => setError(null),
    lastResult,
  }
}
