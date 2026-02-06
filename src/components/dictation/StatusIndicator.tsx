import type { RecordingState } from '@/types/transcription'
import { Mic, Loader2, Sparkles, ClipboardPaste, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StatusIndicatorProps {
  state: RecordingState
}

const stateConfig: Record<RecordingState, { label: string; icon: typeof Mic; color: string }> = {
  IDLE: { label: 'Ready', icon: Mic, color: 'text-muted-foreground' },
  RECORDING: { label: 'Listening...', icon: Mic, color: 'text-red-400' },
  PROCESSING_STT: { label: 'Transcribing...', icon: Loader2, color: 'text-blue-400' },
  PROCESSING_CLEANUP: { label: 'Cleaning up...', icon: Sparkles, color: 'text-purple-400' },
  INJECTING: { label: 'Pasting...', icon: ClipboardPaste, color: 'text-green-400' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-muted-foreground' },
}

export function StatusIndicator({ state }: StatusIndicatorProps) {
  const { label, icon: Icon, color } = stateConfig[state]
  const isAnimating = state === 'PROCESSING_STT' || state === 'PROCESSING_CLEANUP'
  const isRecording = state === 'RECORDING'

  return (
    <div className={cn('flex items-center gap-2 text-sm font-medium transition-colors duration-300', color)}>
      <Icon className={cn('h-4 w-4', isAnimating && 'animate-spin')} />
      <span>{label}</span>
      {isRecording && (
        <span className="ml-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </div>
  )
}
