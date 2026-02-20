import { useState, useEffect, useRef } from 'react'
import { Mic, Loader2, X, Lock, Square } from 'lucide-react'
import { useRecordingState } from '@/hooks/useRecordingState'
import { useElectronBridge } from '@/hooks/useElectronBridge'
import { useSettings } from '@/hooks/useSettings'
import { useSnippets } from '@/hooks/useSnippets'
import { useCustomPrompts } from '@/hooks/useCustomPrompts'
import { PREDEFINED_PROMPTS } from '@/lib/cleanup/predefined-prompts'
import type { PowerMode } from '@/types/power-mode'

export function OverlayShell() {
  const [trialExpired, setTrialExpired] = useState(false)
  const [holdHotkeyLabel, setHoldHotkeyLabel] = useState('Alt')
  const [overlayError, setOverlayError] = useState<string | null>(null)
  const [showPromptPicker, setShowPromptPicker] = useState(false)
  const [powerModes, setPowerModes] = useState<PowerMode[]>([])
  const promptPickerRef = useRef<HTMLDivElement>(null)
  const { settings, hasApiKey, isManagedMode, isLoaded, updateSetting } = useSettings()
  const { snippets } = useSnippets()
  const { userPrompts } = useCustomPrompts()

  // Load power modes once
  useEffect(() => {
    window.electronAPI?.getPowerModes?.().then(modes => setPowerModes(modes ?? []))
  }, [])

  // Listen for trial-expired event from main process
  useEffect(() => {
    const cleanup = window.electronAPI?.onTrialExpired?.(() => {
      setTrialExpired(true)
    })
    return () => cleanup?.()
  }, [])

  // Track the hold hotkey label for display
  useEffect(() => {
    if (settings.holdHotkey) {
      setHoldHotkeyLabel(settings.holdHotkey)
    }
  }, [settings.holdHotkey])

  // Close prompt picker on outside click
  useEffect(() => {
    if (!showPromptPicker) return
    const handler = (e: MouseEvent) => {
      if (promptPickerRef.current && !promptPickerRef.current.contains(e.target as Node)) {
        closePicker()
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showPromptPicker])

  // When in managed mode, route through proxy providers
  const effectiveSttProvider = isManagedMode ? 'managed' : settings.sttProvider
  const effectiveCleanupProvider = isManagedMode
    ? (settings.cleanupEnabled ? 'managed' : 'none')
    : settings.cleanupProvider

  const recording = useRecordingState({
    language: settings.language,
    cleanupEnabled: settings.cleanupEnabled,
    autoCopy: settings.autoCopy,
    sttProvider: effectiveSttProvider,
    cleanupProvider: effectiveCleanupProvider,
    codeMode: settings.codeMode,
    keywordTriggersEnabled: settings.keywordTriggersEnabled,
    outputLength: settings.outputLength,
    promptRefinementEnabled: settings.promptRefinementEnabled,
    fillerWordRemoval: settings.fillerWordRemoval,
    useClipboardContext: settings.useClipboardContext,
    useWindowContext: settings.useWindowContext,
    customVocabulary: settings.customVocabulary,
    wordReplacements: settings.wordReplacements,
    activePromptId: settings.activePromptId,
    userPrompts,
    snippets,
    powerModes,
    powerModesEnabled: settings.powerModesEnabled,
    onComplete: (result) => {
      window.electronAPI?.notifyTranscriptionComplete(result)
    },
  })

  // Auto-clear overlay errors
  useEffect(() => {
    if (overlayError) {
      const t = setTimeout(() => setOverlayError(null), 4000)
      return () => clearTimeout(t)
    }
  }, [overlayError])

  // Listen for hotkey commands from main process
  useElectronBridge({
    onStart: (data) => {
      if (!hasApiKey) {
        const provider = settings.sttProvider || 'OpenAI'
        const providerLabel = provider === 'openai' ? 'OpenAI' : provider === 'groq' ? 'Groq' : provider
        setOverlayError(`No ${providerLabel} key — add one in Settings`)
        return
      }
      recording.startRecording(settings.audioInputDeviceId, data?.mode)
    },
    onStop: () => {
      recording.stopRecording()
    },
    onCancel: () => {
      recording.cancelRecording()
    },
  })

  // Auto-hide error state after delay
  useEffect(() => {
    if (recording.error) {
      const timer = setTimeout(() => {
        recording.clearError()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [recording.error])

  const isRecording = recording.state === 'RECORDING'
  const isProcessing = recording.state === 'PROCESSING_STT' || recording.state === 'PROCESSING_CLEANUP' || recording.state === 'INJECTING'
  const activeError = recording.error || overlayError
  const hasError = !!activeError
  const isIdle = !isRecording && !isProcessing && !hasError && !trialExpired

  // Toggle click-through: idle = clicks pass through, active = interactive
  useEffect(() => {
    window.electronAPI?.setOverlayClickThrough?.(isIdle)
  }, [isIdle])

  // Merge predefined + user prompts (same logic as PromptsSection)
  const allPrompts = [
    ...PREDEFINED_PROMPTS.map(p => {
      const override = userPrompts.find(u => u.id === p.id)
      return override ? { ...p, ...override, isPredefined: true } : p
    }),
    ...userPrompts.filter(p => !PREDEFINED_PROMPTS.some(pre => pre.id === p.id)),
  ]
  const activePrompt = allPrompts.find(p => p.id === settings.activePromptId) ?? allPrompts[0]

  function openPicker() {
    setShowPromptPicker(true)
    window.electronAPI?.expandForPrompts?.(allPrompts.length)
  }

  function closePicker() {
    setShowPromptPicker(false)
    window.electronAPI?.shrinkToIdle?.()
  }

  function selectPrompt(id: string) {
    updateSetting('activePromptId', id)
    closePicker()
  }

  // Format duration as m:ss
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // --- RECORDING STATE: pill with pulsing mic + duration + controls ---
  if (isRecording) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-11 items-center gap-2.5 rounded-full bg-black/95 border border-white/[0.08] shadow-2xl shadow-black/50 px-4 backdrop-blur-xl">
          {/* Pulsing recording indicator */}
          <div className="relative flex items-center justify-center">
            <div className="absolute h-6 w-6 rounded-full bg-red-500/20 animate-ping" />
            <Mic className="relative h-4 w-4 text-red-400" />
          </div>

          {/* Duration */}
          <span className="text-xs font-mono font-medium text-white/60 tabular-nums min-w-[2.5rem]">
            {formatDuration(recording.duration)}
          </span>

          {/* Power mode badge during recording */}
          {recording.matchedMode && (
            <span className="text-xs text-white/50 max-w-[80px] truncate">
              {recording.matchedMode.emoji} {recording.matchedMode.name}
            </span>
          )}

          <div className="w-px h-4 bg-white/[0.08]" />

          {/* Stop */}
          <button
            onClick={() => {
              window.electronAPI?.notifyRecordingStopped()
              recording.stopRecording()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
            title="Stop recording"
          >
            <Square className="h-3 w-3 text-white/80 fill-white/80" />
          </button>

          {/* Cancel */}
          <button
            onClick={() => {
              window.electronAPI?.notifyRecordingCancelled()
              recording.cancelRecording()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors"
            title="Cancel recording"
          >
            <X className="h-3.5 w-3.5 text-white/40" />
          </button>
        </div>
      </div>
    )
  }

  // --- PROCESSING STATE: single spinner pill ---
  if (isProcessing) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-11 items-center gap-2.5 rounded-full bg-black/95 border border-white/[0.08] shadow-2xl shadow-black/50 px-5 backdrop-blur-xl">
          <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
          <span className="text-xs font-medium text-white/60">Processing...</span>
        </div>
      </div>
    )
  }

  // --- TRIAL EXPIRED: compact persistent message ---
  if (trialExpired) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/95 border border-white/[0.08] shadow-2xl shadow-black/50 p-3.5 max-w-[210px] backdrop-blur-xl">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-medium text-amber-400">Trial expired</span>
            </div>
            <button
              onClick={() => {
                setTrialExpired(false)
                window.electronAPI?.hideOverlay()
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors"
            >
              <X className="h-2.5 w-2.5 text-white/30" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 w-full">
            <button
              onClick={() => {
                setTrialExpired(false)
                window.electronAPI?.showMainWindow()
              }}
              className="flex-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] px-2 py-1 text-[10px] font-medium text-white/70 transition-colors"
            >
              Own Key
            </button>
            <button
              onClick={() => {
                setTrialExpired(false)
                window.electronAPI?.openExternal('https://voxgenflow.vercel.app/#pricing')
                window.electronAPI?.hideOverlay()
              }}
              className="flex-1 rounded-lg bg-purple-600 hover:bg-purple-500 px-2 py-1 text-[10px] font-medium text-white transition-colors"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- ERROR: auto-hides after 4 seconds, shows the actual error ---
  if (hasError) {
    // Friendly short messages for common errors
    let displayError = activeError || 'Something went wrong'
    if (displayError.toLowerCase().includes('not configured') || displayError.toLowerCase().includes('api key')) {
      displayError = 'No API key — open Settings'
    } else if (displayError.toLowerCase().includes('network') || displayError.toLowerCase().includes('fetch')) {
      displayError = 'Network error — check connection'
    } else if (displayError.toLowerCase().includes('microphone') || displayError.toLowerCase().includes('permission')) {
      displayError = 'Mic permission denied'
    } else if (displayError.length > 40) {
      displayError = displayError.slice(0, 37) + '…'
    }
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-11 items-center gap-2 rounded-full bg-black/95 border border-red-500/30 shadow-2xl shadow-black/50 px-4 backdrop-blur-xl max-w-[300px]">
          <div className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
          <span className="text-[11px] font-medium text-red-300 truncate">{displayError}</span>
        </div>
      </div>
    )
  }

  // --- IDLE STATE: tiny waveform bars — click-through, hover wave animation ---
  return (
    <div className="flex h-full w-full items-end justify-center pb-2">
      {/* Waveform indicator — click-through, subtle wave on hover */}
      <div
        className="group flex items-end gap-[3px] h-7 px-3 opacity-20 hover:opacity-50 transition-opacity"
        title="VoxGen"
      >
        <div className="overlay-bar w-[3px] rounded-full bg-white" style={{ height: '8px', animationDelay: '0s' }} />
        <div className="overlay-bar w-[3px] rounded-full bg-white" style={{ height: '13px', animationDelay: '0.15s' }} />
        <div className="overlay-bar w-[3px] rounded-full bg-white" style={{ height: '5px', animationDelay: '0.3s' }} />
        <div className="overlay-bar w-[3px] rounded-full bg-white" style={{ height: '10px', animationDelay: '0.45s' }} />
        <div className="overlay-bar w-[3px] rounded-full bg-white" style={{ height: '7px', animationDelay: '0.6s' }} />
      </div>
    </div>
  )
}
