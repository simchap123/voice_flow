import { useEffect } from 'react'
import { Mic, Loader2, X } from 'lucide-react'
import { useRecordingState } from '@/hooks/useRecordingState'
import { useElectronBridge } from '@/hooks/useElectronBridge'
import { useSettings } from '@/hooks/useSettings'
import { useSnippets } from '@/hooks/useSnippets'

export function OverlayShell() {
  const { settings, hasApiKey, isLoaded } = useSettings()
  const { snippets } = useSnippets()

  const recording = useRecordingState({
    language: settings.language,
    cleanupEnabled: settings.cleanupEnabled,
    autoCopy: settings.autoCopy,
    sttProvider: settings.sttProvider,
    cleanupProvider: settings.cleanupProvider,
    snippets,
    onComplete: (result) => {
      // Notify main window about the completed transcription
      window.electronAPI?.notifyTranscriptionComplete(result)
      // Hide overlay after injection
      setTimeout(() => window.electronAPI?.hideOverlay(), 300)
    },
  })

  // Listen for hotkey commands from main process
  useElectronBridge({
    onStart: () => {
      // Check if API key is configured before starting
      if (!hasApiKey) {
        recording.cancelRecording()
        return
      }
      recording.startRecording(settings.audioInputDeviceId)
    },
    onStop: () => recording.stopRecording(),
    onCancel: () => recording.cancelRecording(),
  })

  // Auto-hide overlay on error after a delay
  useEffect(() => {
    if (recording.error) {
      const timer = setTimeout(() => {
        window.electronAPI?.hideOverlay()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [recording.error])

  const isRecording = recording.state === 'RECORDING'
  const isProcessing = recording.state === 'PROCESSING_STT' || recording.state === 'PROCESSING_CLEANUP' || recording.state === 'INJECTING'
  const hasError = !!recording.error

  // Determine animation class
  let animClass = ''
  if (isRecording) animClass = 'animate-overlay-bounce'
  else if (isProcessing) animClass = 'animate-pulse'

  return (
    <div className="flex h-full w-full items-center justify-center p-0 m-0">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-black/90 border border-white/10 shadow-lg ${animClass}`}
      >
        {hasError ? (
          <X className="h-5 w-5 text-red-400" />
        ) : isProcessing ? (
          <Loader2 className="h-5 w-5 text-white/80 animate-spin" />
        ) : (
          <Mic className={`h-5 w-5 ${isRecording ? 'text-red-400' : 'text-white/80'}`} />
        )}
      </div>
    </div>
  )
}
