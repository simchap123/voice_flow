import { useEffect, useCallback } from 'react'
import type { RecordingState } from '@/types/transcription'
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
  const { settings } = useSettings()
  const { snippets } = useSnippets()

  const recording = useRecordingState({
    language: settings.language,
    cleanupEnabled: settings.cleanupEnabled,
    autoCopy: settings.autoCopy,
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
    onStart: () => recording.startRecording(settings.audioInputDeviceId),
    onStop: () => recording.stopRecording(),
    onCancel: () => recording.cancelRecording(),
  })

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="flex w-full max-w-[360px] flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/70 p-5 shadow-2xl backdrop-blur-xl animate-overlay-enter">
        {/* Status */}
        <div key={recording.state} className="animate-status-fade">
          <StatusIndicator state={recording.state} />
        </div>

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
        <MicButton
          state={recording.state}
          onStart={() => recording.startRecording(settings.audioInputDeviceId)}
          onStop={() => recording.stopRecording()}
          compact
        />
      </div>
    </div>
  )
}
