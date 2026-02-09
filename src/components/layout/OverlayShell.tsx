import { useState, useEffect } from 'react'
import { Mic, Loader2, X, Lock, Square } from 'lucide-react'
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
    snippets,
    onComplete: (result) => {
      // Shrink overlay back before processing/hiding
      window.electronAPI?.shrinkOverlay()
      // Notify main window about the completed transcription
      window.electronAPI?.notifyTranscriptionComplete(result)
      // Hide overlay after injection
      setTimeout(() => window.electronAPI?.hideOverlay(), 300)
    },
  })

  // Listen for hotkey commands from main process
  useElectronBridge({
    onStart: (data) => {
      // Check if API key is configured before starting
      if (!hasApiKey) {
        recording.cancelRecording()
        return
      }
      // Expand overlay to show controls
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

  // Determine animation class for compact dot
  let animClass = ''
  if (isProcessing) animClass = 'animate-pulse'

  // Recording: show expanded layout with controls
  if (isRecording) {
    return (
      <div className="flex h-full w-full items-center justify-center p-0 m-0">
        <div className="flex h-12 items-center gap-2 rounded-full bg-black/90 border border-white/10 shadow-lg px-3 animate-overlay-bounce">
          {/* Pulsing mic indicator */}
          <Mic className="h-4 w-4 text-red-400 animate-pulse shrink-0" />

          {/* Stop button */}
          <button
            onClick={() => {
              window.electronAPI?.shrinkOverlay()
              recording.stopRecording()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Stop recording"
          >
            <Square className="h-3 w-3 text-white fill-white" />
          </button>

          {/* Cancel button */}
          <button
            onClick={() => {
              window.electronAPI?.shrinkOverlay()
              recording.cancelRecording()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-red-500/30 transition-colors"
            title="Cancel recording"
          >
            <X className="h-3 w-3 text-white/70" />
          </button>
        </div>
      </div>
    )
  }

  // Compact dot for idle/processing/error states
  return (
    <div className="flex h-full w-full items-center justify-center p-0 m-0">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-black/90 border border-white/10 shadow-lg ${animClass}`}
      >
        {trialExpired ? (
          <Lock className="h-5 w-5 text-yellow-400" />
        ) : hasError ? (
          <X className="h-5 w-5 text-red-400" />
        ) : isProcessing ? (
          <Loader2 className="h-5 w-5 text-white/80 animate-spin" />
        ) : (
          <Mic className="h-5 w-5 text-white/80" />
        )}
      </div>
    </div>
  )
}
