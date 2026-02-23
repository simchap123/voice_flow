import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Lock, Download } from 'lucide-react'
import { useRecordingState } from '@/hooks/useRecordingState'
import { useElectronBridge } from '@/hooks/useElectronBridge'
import { useSettings } from '@/hooks/useSettings'
import { useSnippets } from '@/hooks/useSnippets'
import { useCustomPrompts } from '@/hooks/useCustomPrompts'
import { useModelDownload } from '@/hooks/useModelDownload'
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

export function OverlayShell() {
  const [trialExpired, setTrialExpired] = useState(false)
  const [holdHotkeyLabel, setHoldHotkeyLabel] = useState('Right Alt')
  const [overlayError, setOverlayError] = useState<string | null>(null)
  const [showPromptPicker, setShowPromptPicker] = useState(false)
  const [powerModes, setPowerModes] = useState<PowerMode[]>([])
  const promptPickerRef = useRef<HTMLDivElement>(null)
  const { settings, hasApiKey, isManagedMode, isLoaded, updateSetting } = useSettings()
  const { snippets } = useSnippets()
  const { userPrompts } = useCustomPrompts()
  const { isDownloading: modelDownloading, progress: modelProgress } = useModelDownload(settings.sttProvider)

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
  const HOTKEY_DISPLAY: Record<string, string> = {
    RightAlt: 'Right Alt', LeftAlt: 'Left Alt',
    RightControl: 'Right Ctrl', LeftControl: 'Left Ctrl',
    RightShift: 'Right Shift', LeftShift: 'Left Shift',
  }
  useEffect(() => {
    if (settings.holdHotkey) {
      setHoldHotkeyLabel(HOTKEY_DISPLAY[settings.holdHotkey] || settings.holdHotkey)
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

  // Local always uses local; managed proxy only for Groq (server-side key)
  const effectiveSttProvider = settings.sttProvider === 'local'
    ? 'local'
    : (isManagedMode ? 'managed' : settings.sttProvider)
  const effectiveCleanupProvider = settings.sttProvider === 'local'
    ? (settings.cleanupEnabled ? settings.cleanupProvider : 'none')
    : (isManagedMode ? (settings.cleanupEnabled ? 'managed' : 'none') : settings.cleanupProvider)

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
        const provider = settings.sttProvider || 'groq'
        const providerLabel = provider === 'openai' ? 'OpenAI' : provider === 'groq' ? 'Groq' : provider
        setOverlayError(`No ${providerLabel} key — add one or switch to Local`)
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

  // Live audio level for waveform visualization
  const audioLevel = useAudioLevel(isRecording)
  const activeError = recording.error || overlayError
  const hasError = !!activeError
  const isIdle = !isRecording && !hasError && !trialExpired

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

  // --- RECORDING STATE: minimal translucent waveform pill ---
  if (isRecording) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-10 items-center gap-2 rounded-full bg-white/10 border border-white/[0.08] shadow-lg backdrop-blur-md px-3">
          {/* Clickable waveform — stops recording */}
          <button
            onClick={() => {
              window.electronAPI?.notifyRecordingStopped()
              recording.stopRecording()
            }}
            className="flex items-center gap-[3px] h-5 cursor-pointer active:scale-95 transition-transform"
            title="Click to stop recording"
          >
            {[0.4, 0.65, 1.0, 0.8, 0.5, 0.7, 0.35].map((weight, i) => {
              const barHeight = 4 + Math.max(audioLevel * weight * 16, Math.sin(Date.now() / 400 + i) * 2 + 2)
              return (
                <div
                  key={i}
                  className="w-[3px] rounded-full transition-all duration-75"
                  style={{
                    height: `${barHeight}px`,
                    background: `linear-gradient(to top, rgba(239,68,68,0.85), rgba(251,146,60,${0.35 + audioLevel * 0.65}))`,
                  }}
                />
              )
            })}
          </button>

          {/* Cancel */}
          <button
            onClick={() => {
              window.electronAPI?.notifyRecordingCancelled()
              recording.cancelRecording()
            }}
            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/[0.1] active:scale-95 transition-all ml-0.5"
            title="Cancel recording"
          >
            <X className="h-2.5 w-2.5 text-white/30 hover:text-white/50" />
          </button>
        </div>
      </div>
    )
  }

  // --- MODEL DOWNLOADING: translucent pill with progress (click-through) ---
  if (modelDownloading && !isRecording) {
    return (
      <div className="flex h-full w-full items-end justify-center pb-2">
        <div className="flex h-7 items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.06] px-2.5 opacity-40">
          <Download className="h-2.5 w-2.5 text-white/60 animate-pulse" />
          <span className="text-[10px] font-medium text-white/50">
            {modelProgress > 0 ? `${modelProgress}%` : 'Loading…'}
          </span>
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
                updateSetting('sttProvider', 'local')
                window.electronAPI?.hideOverlay()
              }}
              className="flex-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] px-2 py-1 text-[10px] font-medium text-white/70 transition-colors"
            >
              Use Local
            </button>
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
    if (displayError.toLowerCase().includes('not configured') || displayError.toLowerCase().includes('api key') || displayError.toLowerCase().includes('switch to local')) {
      displayError = 'Add API key or switch to Local in Settings'
    } else if (displayError.toLowerCase().includes('email') || displayError.toLowerCase().includes('trial')) {
      displayError = 'Add email or switch to Local in Settings'
    } else if (displayError.toLowerCase().includes('network') || displayError.toLowerCase().includes('fetch')) {
      displayError = 'Network error — try Local mode (offline)'
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
