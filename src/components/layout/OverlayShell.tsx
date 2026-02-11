import { useState, useEffect } from 'react'
import { Mic, Loader2, X, Lock, Square } from 'lucide-react'
import { useRecordingState } from '@/hooks/useRecordingState'
import { useElectronBridge } from '@/hooks/useElectronBridge'
import { useSettings } from '@/hooks/useSettings'
import { useSnippets } from '@/hooks/useSnippets'

export function OverlayShell() {
  const [trialExpired, setTrialExpired] = useState(false)
  const [holdHotkeyLabel, setHoldHotkeyLabel] = useState('Alt')
  const { settings, hasApiKey, isLoaded } = useSettings()
  const { snippets } = useSnippets()

  // Listen for trial-expired event from main process
  useEffect(() => {
    const cleanup = window.electronAPI?.onTrialExpired?.(() => {
      setTrialExpired(true)
      setTimeout(() => setTrialExpired(false), 2000)
    })
    return () => cleanup?.()
  }, [])

  // Track the hold hotkey label for display
  useEffect(() => {
    if (settings.holdHotkey) {
      setHoldHotkeyLabel(settings.holdHotkey)
    }
  }, [settings.holdHotkey])

  const recording = useRecordingState({
    language: settings.language,
    cleanupEnabled: settings.cleanupEnabled,
    autoCopy: settings.autoCopy,
    sttProvider: settings.sttProvider,
    cleanupProvider: settings.cleanupProvider,
    codeMode: settings.codeMode,
    keywordTriggersEnabled: settings.keywordTriggersEnabled,
    outputLength: settings.outputLength,
    promptRefinementEnabled: settings.promptRefinementEnabled,
    snippets,
    onComplete: (result) => {
      window.electronAPI?.notifyTranscriptionComplete(result)
    },
  })

  // Listen for hotkey commands from main process
  useElectronBridge({
    onStart: (data) => {
      if (!hasApiKey) {
        recording.cancelRecording()
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
        // Error will auto-clear, returning to idle
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [recording.error])

  const isRecording = recording.state === 'RECORDING'
  const isProcessing = recording.state === 'PROCESSING_STT' || recording.state === 'PROCESSING_CLEANUP' || recording.state === 'INJECTING'
  const hasError = !!recording.error
  const isIdle = !isRecording && !isProcessing && !hasError && !trialExpired

  // --- RECORDING STATE: dark pill with mic + stop + cancel ---
  if (isRecording) {
    return (
      <div className="flex h-full w-full items-end justify-center pb-1">
        <div className="flex h-11 items-center gap-2 rounded-full bg-black/90 border border-white/10 shadow-2xl px-4">
          <Mic className="h-4 w-4 text-red-400 animate-mic-pulse shrink-0" />
          <span className="text-xs font-medium text-white/70">Recording...</span>
          <div className="w-px h-5 bg-white/10" />
          <button
            onClick={() => {
              window.electronAPI?.notifyRecordingStopped()
              recording.stopRecording()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
            title="Stop recording"
          >
            <Square className="h-3 w-3 text-white/80 fill-white/80" />
          </button>
          <button
            onClick={() => {
              window.electronAPI?.notifyRecordingCancelled()
              recording.cancelRecording()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
            title="Cancel recording"
          >
            <X className="h-3.5 w-3.5 text-white/50" />
          </button>
        </div>
      </div>
    )
  }

  // --- PROCESSING STATE: pill with spinner ---
  if (isProcessing) {
    return (
      <div className="flex h-full w-full items-end justify-center pb-1">
        <div className="flex h-11 items-center gap-2.5 rounded-full bg-black/90 border border-white/10 shadow-2xl px-5">
          <Loader2 className="h-4 w-4 text-white/80 animate-spin" />
          <span className="text-xs font-medium text-white/70">Processing...</span>
        </div>
      </div>
    )
  }

  // --- ERROR / TRIAL EXPIRED ---
  if (hasError || trialExpired) {
    return (
      <div className="flex h-full w-full items-end justify-center pb-1">
        <div className="flex h-11 items-center gap-2.5 rounded-full bg-black/90 border border-white/10 shadow-2xl px-5">
          {trialExpired ? (
            <>
              <Lock className="h-4 w-4 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400">Trial expired</span>
            </>
          ) : (
            <>
              <X className="h-4 w-4 text-red-400" />
              <span className="text-xs font-medium text-red-400">Error</span>
            </>
          )}
        </div>
      </div>
    )
  }

  // --- IDLE STATE: thin bar → expands on hover with CSS ---
  return (
    <div className="group flex h-full w-full items-end justify-center pb-1">
      {/* Thin minimized bar — visible when NOT hovering */}
      <div className="flex items-center justify-center transition-all duration-300 ease-out group-hover:opacity-0 group-hover:scale-95 group-hover:pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2">
        <div className="h-1 w-24 rounded-full bg-white/20" />
      </div>

      {/* Expanded hover bar — visible on hover */}
      <div className="flex h-10 items-center gap-2 rounded-full bg-black/90 border border-white/10 shadow-2xl px-4 opacity-0 scale-95 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100">
        <Mic className="h-4 w-4 text-white/60 shrink-0" />
        <span className="text-xs text-white/50 whitespace-nowrap">
          Hold <kbd className="mx-0.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/70">{holdHotkeyLabel}</kbd> to dictate
        </span>
        <div className="w-px h-4 bg-white/10" />
        <button
          onClick={() => window.electronAPI?.hideOverlay()}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
          title="Hide overlay"
        >
          <X className="h-3 w-3 text-white/40" />
        </button>
      </div>
    </div>
  )
}
