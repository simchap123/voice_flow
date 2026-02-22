import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Loader2, X, Lock, Square } from 'lucide-react'
import { useRecordingState } from '@/hooks/useRecordingState'
import { useElectronBridge } from '@/hooks/useElectronBridge'
import { useSettings } from '@/hooks/useSettings'
import { useSnippets } from '@/hooks/useSnippets'
import { useCustomPrompts } from '@/hooks/useCustomPrompts'
import { PREDEFINED_PROMPTS } from '@/lib/cleanup/predefined-prompts'
import type { PowerMode } from '@/types/power-mode'

/** Live audio level using Web Audio API */
function useAudioLevel(isRecording: boolean) {
  const [level, setLevel] = useState(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef = useRef<number>(0)
  const contextRef = useRef<AudioContext | null>(null)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      contextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      sourceRef.current = source
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.7
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(dataArray)
        const voiceBins = dataArray.slice(0, 32)
        const avg = voiceBins.reduce((a, b) => a + b, 0) / voiceBins.length / 255
        setLevel(avg)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // mic not available
    }
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    sourceRef.current?.disconnect()
    contextRef.current?.close()
    analyserRef.current = null
    sourceRef.current = null
    contextRef.current = null
    setLevel(0)
  }, [])

  useEffect(() => {
    if (isRecording) start()
    else stop()
    return stop
  }, [isRecording, start, stop])

  return level
}

/** Waveform bars reacting to audio level */
function AudioWaveform({ level }: { level: number }) {
  const bars = [0.4, 0.7, 1.0, 0.65, 0.35]
  return (
    <div className="flex items-center gap-[2.5px] h-4">
      {bars.map((weight, i) => {
        const barHeight = 3 + Math.max(level * weight * 13, Math.sin(Date.now() / 400 + i) * 1.5 + 1.5)
        return (
          <div
            key={i}
            className="w-[2.5px] rounded-full transition-all duration-75"
            style={{
              height: `${barHeight}px`,
              background: `linear-gradient(to top, rgba(239,68,68,0.9), rgba(251,146,60,${0.4 + level * 0.6}))`,
            }}
          />
        )
      })}
    </div>
  )
}

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

  // Live audio level for waveform visualization
  const audioLevel = useAudioLevel(isRecording)
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

  // --- RECORDING STATE: glassmorphic pill with live waveform ---
  if (isRecording) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-12 items-center gap-3 rounded-full bg-black/90 border border-white/[0.06] shadow-2xl shadow-black/60 px-4 backdrop-blur-2xl">
          {/* Glow ring behind mic icon */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute rounded-full bg-red-500/30 blur-sm transition-all duration-150"
              style={{
                width: `${22 + audioLevel * 14}px`,
                height: `${22 + audioLevel * 14}px`,
                opacity: 0.4 + audioLevel * 0.5,
              }}
            />
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20">
              <Mic className="h-3.5 w-3.5 text-red-400" />
            </div>
          </div>

          {/* Live waveform bars */}
          <AudioWaveform level={audioLevel} />

          {/* Duration */}
          <span className="text-[11px] font-mono font-medium text-white/50 tabular-nums min-w-[2.2rem]">
            {formatDuration(recording.duration)}
          </span>

          {/* Power mode badge */}
          {recording.matchedMode && (
            <span className="text-[10px] text-white/40 max-w-[60px] truncate">
              {recording.matchedMode.emoji}
            </span>
          )}

          <div className="w-px h-5 bg-white/[0.06]" />

          {/* Stop */}
          <button
            onClick={() => {
              window.electronAPI?.notifyRecordingStopped()
              recording.stopRecording()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] active:scale-95 transition-all"
            title="Stop recording"
          >
            <Square className="h-2.5 w-2.5 text-white/70 fill-white/70" />
          </button>

          {/* Cancel */}
          <button
            onClick={() => {
              window.electronAPI?.notifyRecordingCancelled()
              recording.cancelRecording()
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/[0.08] active:scale-95 transition-all"
            title="Cancel recording"
          >
            <X className="h-3 w-3 text-white/30 hover:text-white/50" />
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

  // --- ERROR: clickable pill that opens Settings, auto-hides after 4 seconds ---
  if (hasError) {
    // Friendly short messages for common errors
    let displayError = activeError || 'Something went wrong'
    if (displayError.toLowerCase().includes('not configured') || displayError.toLowerCase().includes('api key')) {
      displayError = 'No API key — click to open Settings'
    } else if (displayError.toLowerCase().includes('network') || displayError.toLowerCase().includes('fetch')) {
      displayError = 'Network error — check connection'
    } else if (displayError.toLowerCase().includes('microphone') || displayError.toLowerCase().includes('permission')) {
      displayError = 'Mic permission denied'
    } else if (displayError.length > 40) {
      displayError = displayError.slice(0, 37) + '…'
    }
    return (
      <div className="flex h-full w-full items-center justify-center">
        <button
          onClick={() => {
            window.electronAPI?.showMainWindow()
            setOverlayError(null)
            recording.clearError()
            window.electronAPI?.hideOverlay()
          }}
          className="flex h-11 items-center gap-2 rounded-full bg-black/95 border border-red-500/30 shadow-2xl shadow-black/50 px-4 backdrop-blur-xl max-w-[300px] cursor-pointer hover:border-red-400/50 transition-colors"
        >
          <div className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
          <span className="text-[11px] font-medium text-red-300 truncate">{displayError}</span>
        </button>
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
