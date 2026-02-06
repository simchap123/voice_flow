import { Mic, Square, Loader2 } from 'lucide-react'
import type { RecordingState } from '@/types/transcription'
import { cn } from '@/lib/cn'

interface MicButtonProps {
  state: RecordingState
  onStart: () => void
  onStop: () => void
  compact?: boolean
}

export function MicButton({ state, onStart, onStop, compact = false }: MicButtonProps) {
  const isRecording = state === 'RECORDING'
  const isProcessing = state === 'PROCESSING_STT' || state === 'PROCESSING_CLEANUP' || state === 'INJECTING'
  const isIdle = state === 'IDLE' || state === 'CANCELLED'

  const handleClick = () => {
    if (isIdle) onStart()
    else if (isRecording) onStop()
  }

  const size = compact ? 'h-12 w-12' : 'h-20 w-20'
  const iconSize = compact ? 'h-5 w-5' : 'h-8 w-8'

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse ring when recording */}
      {isRecording && (
        <>
          <div className={cn('absolute rounded-full bg-red-500/20 animate-pulse-ring', size)} />
          <div className={cn('absolute rounded-full bg-red-500/10 animate-pulse-ring [animation-delay:0.5s]', size)} />
        </>
      )}

      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={cn(
          'relative z-10 flex items-center justify-center rounded-full transition-all duration-200',
          size,
          isRecording
            ? 'bg-red-500 shadow-lg shadow-red-500/30 hover:bg-red-600 animate-mic-breathe'
            : isProcessing
            ? 'bg-primary/50 cursor-wait'
            : 'bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95'
        )}
      >
        {isProcessing ? (
          <Loader2 className={cn(iconSize, 'animate-spin text-white')} />
        ) : isRecording ? (
          <Square className={cn(compact ? 'h-4 w-4' : 'h-6 w-6', 'text-white fill-white')} />
        ) : (
          <Mic className={cn(iconSize, 'text-white')} />
        )}
      </button>
    </div>
  )
}
