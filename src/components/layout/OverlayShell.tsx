import { useEffect } from 'react'
import { useRecordingState } from '@/hooks/useRecordingState'
import { useElectronBridge } from '@/hooks/useElectronBridge'
import { useSettings } from '@/hooks/useSettings'
import { useSnippets } from '@/hooks/useSnippets'
import { useWaveform } from '@/hooks/useWaveform'
import { MicButton } from '@/components/dictation/MicButton'
import { WaveformVisualizer } from '@/components/dictation/WaveformVisualizer'
import { StatusIndicator } from '@/components/dictation/StatusIndicator'
import { formatDuration } from '@/lib/audio-utils'

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

  const canvasRef = useWaveform(recording.analyserNode)

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

  const showNoApiKeyWarning = isLoaded && !hasApiKey

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="flex w-full max-w-[360px] flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/70 p-5 shadow-2xl backdrop-blur-xl animate-overlay-enter">
        {/* No API key warning */}
        {showNoApiKeyWarning && (
          <div className="text-center animate-fade-in">
            <div className="text-sm font-medium text-yellow-400">API Key Required</div>
            <div className="mt-1 text-xs text-white/50">Open VoiceFlow and add your API key in Settings</div>
          </div>
        )}

        {/* Status */}
        {!showNoApiKeyWarning && (
          <div key={recording.state} className="animate-status-fade">
            <StatusIndicator state={recording.state} />
          </div>
        )}

        {/* Waveform */}
        {recording.state === 'RECORDING' && (
          <div className="animate-fade-in">
            <WaveformVisualizer canvasRef={canvasRef} />
          </div>
        )}

        {/* Duration */}
        {recording.state === 'RECORDING' && (
          <div className="text-sm font-mono text-white/60 animate-fade-in">
            {formatDuration(recording.duration)}
          </div>
        )}

        {/* Preview text */}
        {recording.cleanedText && (
          <div className="max-h-16 w-full overflow-hidden rounded-lg bg-white/5 p-2 text-xs text-white/70 animate-fade-in">
            {recording.cleanedText.slice(0, 150)}
            {recording.cleanedText.length > 150 && '...'}
          </div>
        )}

        {/* Error */}
        {recording.error && (
          <div className="text-xs text-red-400 animate-fade-in">{recording.error}</div>
        )}

        {/* Mic button (fallback for click-based control) */}
        {!showNoApiKeyWarning && (
          <MicButton
            state={recording.state}
            onStart={() => recording.startRecording(settings.audioInputDeviceId)}
            onStop={() => recording.stopRecording()}
            compact
          />
        )}
      </div>
    </div>
  )
}
