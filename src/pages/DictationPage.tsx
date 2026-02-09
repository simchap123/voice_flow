import { useState } from 'react'
import { useRecordingState } from '@/hooks/useRecordingState'
import { useWaveform } from '@/hooks/useWaveform'
import { useElectronBridge } from '@/hooks/useElectronBridge'
import { useSettings } from '@/hooks/useSettings'
import { useSnippets } from '@/hooks/useSnippets'
import { useTranscriptionHistory } from '@/hooks/useTranscriptionHistory'
import { MicButton } from '@/components/dictation/MicButton'
import { WaveformVisualizer } from '@/components/dictation/WaveformVisualizer'
import { StatusIndicator } from '@/components/dictation/StatusIndicator'
import { TranscriptionPreview } from '@/components/dictation/TranscriptionPreview'
import { formatDuration } from '@/lib/audio-utils'
import { Keyboard } from 'lucide-react'

export function DictationPage() {
  const { settings, hasApiKey } = useSettings()
  const { snippets } = useSnippets()
  const { addEntry } = useTranscriptionHistory()
  const [showRaw, setShowRaw] = useState(false)

  const recording = useRecordingState({
    language: settings.language,
    cleanupEnabled: settings.cleanupEnabled,
    autoCopy: settings.autoCopy,
    snippets,
    sttProvider: settings.sttProvider,
    cleanupProvider: settings.cleanupProvider,
    codeMode: settings.codeMode,
    onComplete: (result) => {
      addEntry({
        rawText: result.rawText,
        cleanedText: result.cleanedText,
        duration: result.duration,
        timestamp: result.timestamp,
        language: result.language,
        wordCount: result.wordCount,
      })
    },
  })

  const canvasRef = useWaveform(recording.analyserNode)

  useElectronBridge({
    onStart: (data) => recording.startRecording(settings.audioInputDeviceId, data?.mode),
    onStop: () => recording.stopRecording(),
    onCancel: () => recording.cancelRecording(),
  })

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Dictation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasApiKey ? 'Press the mic button or use your hotkey' : 'Set your API key in Settings to begin'}
        </p>
      </div>

      {/* Status */}
      <StatusIndicator state={recording.state} />

      {/* Waveform */}
      {recording.state === 'RECORDING' && (
        <div className="w-full max-w-md">
          <WaveformVisualizer canvasRef={canvasRef} />
          <div className="mt-2 text-center text-sm font-mono text-muted-foreground">
            {formatDuration(recording.duration)}
          </div>
        </div>
      )}

      {/* Mic button */}
      <MicButton
        state={recording.state}
        onStart={() => recording.startRecording(settings.audioInputDeviceId)}
        onStop={() => recording.stopRecording()}
      />

      {/* Hotkey hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Keyboard className="h-3 w-3" />
        <span>
          {settings.holdHotkey && (
            <>Hold <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{settings.holdHotkey}</kbd> to record</>
          )}
          {settings.holdHotkey && settings.toggleHotkey && ' | '}
          {settings.toggleHotkey && (
            <>Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{settings.toggleHotkey}</kbd> to toggle</>
          )}
        </span>
      </div>

      {/* Transcription preview */}
      {(recording.rawText || recording.cleanedText) && (
        <div className="w-full max-w-md">
          <div className="mb-2 flex justify-end">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showRaw ? 'Show cleaned' : 'Show raw'}
            </button>
          </div>
          <TranscriptionPreview
            rawText={recording.rawText}
            cleanedText={recording.cleanedText}
            showRaw={showRaw}
          />
        </div>
      )}

      {/* Error */}
      {recording.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {recording.error}
        </div>
      )}
    </div>
  )
}
