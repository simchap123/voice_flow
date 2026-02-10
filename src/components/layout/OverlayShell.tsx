import { useState, useEffect } from 'react'
import { Mic, Loader2, X, Lock, Square, Settings } from 'lucide-react'
import { useRecordingState } from '@/hooks/useRecordingState'
import { useElectronBridge } from '@/hooks/useElectronBridge'
import { useSettings } from '@/hooks/useSettings'
import { useSnippets } from '@/hooks/useSnippets'

export function OverlayShell() {
  const [trialExpired, setTrialExpired] = useState(false)
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
      window.electronAPI?.shrinkOverlay()
      window.electronAPI?.notifyTranscriptionComplete(result)
      setTimeout(() => window.electronAPI?.hideOverlay(), 300)
    },
  })

  // Listen for hotkey commands from main process
  useElectronBridge({
    onStart: (data) => {
      if (!hasApiKey) {
        recording.cancelRecording()
        return
      }
      window.electronAPI?.expandOverlay()
      recording.startRecording(settings.audioInputDeviceId, data?.mode)
    },
    onStop: () => {
      window.electronAPI?.shrinkOverlay()
      recording.stopRecording()
    },
    onCancel: () => {
      window.electronAPI?.shrinkOverlay()
      recording.cancelRecording()
    },
  })

  // Auto-hide overlay on error after a delay
  useEffect(() => {
    if (recording.error) {
      window.electronAPI?.shrinkOverlay()
      const timer = setTimeout(() => {
        window.electronAPI?.hideOverlay()
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
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-10 items-center gap-1.5 rounded-full bg-black/90 border border-white/10 shadow-lg px-3">
          {/* Mic with subtle pulse — just the icon, not the whole bar */}
          <Mic className="h-4 w-4 text-red-400 animate-mic-pulse shrink-0" />

          {/* Separator */}
          <div className="w-px h-4 bg-white/10" />

          {/* Stop button */}
          <button
            onClick={() => {
              window.electronAPI?.shrinkOverlay()
              window.electronAPI?.notifyRecordingStopped()
              recording.stopRecording()
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
            title="Stop recording"
          >
            <Square className="h-3 w-3 text-white/80 fill-white/80" />
          </button>

          {/* Cancel button */}
          <button
            onClick={() => {
              window.electronAPI?.shrinkOverlay()
              window.electronAPI?.notifyRecordingCancelled()
              recording.cancelRecording()
              setTimeout(() => window.electronAPI?.hideOverlay(), 150)
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
            title="Cancel recording"
          >
            <X className="h-3 w-3 text-white/50" />
          </button>
        </div>
      </div>
    )
  }

  // --- PROCESSING STATE: compact dot with spinner ---
  if (isProcessing) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/90 border border-white/10 shadow-lg">
          <Loader2 className="h-5 w-5 text-white/80 animate-spin" />
        </div>
      </div>
    )
  }

  // --- ERROR / TRIAL EXPIRED: compact dot ---
  if (hasError || trialExpired) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/90 border border-white/10 shadow-lg">
          {trialExpired ? (
            <Lock className="h-5 w-5 text-yellow-400" />
          ) : (
            <X className="h-5 w-5 text-red-400" />
          )}
        </div>
      </div>
    )
  }

  // --- IDLE STATE: toolbar with mic, settings, close ---
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex h-9 items-center gap-0.5 rounded-full bg-black/90 border border-white/10 shadow-lg px-2.5">
        {/* Mic icon — opens main window */}
        <button
          onClick={() => window.electronAPI?.showMainWindow()}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
          title="VoxGen"
        >
          <Mic className="h-3.5 w-3.5 text-white/70" />
        </button>

        {/* Settings gear — opens main window */}
        <button
          onClick={() => window.electronAPI?.showMainWindow()}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
          title="Settings"
        >
          <Settings className="h-3.5 w-3.5 text-white/40" />
        </button>

        {/* Separator */}
        <div className="w-px h-3.5 bg-white/10 mx-0.5" />

        {/* Close — hide overlay */}
        <button
          onClick={() => window.electronAPI?.hideOverlay()}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
          title="Hide"
        >
          <X className="h-3 w-3 text-white/40" />
        </button>
      </div>
    </div>
  )
}
