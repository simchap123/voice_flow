import { Trash2, Copy, Check, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { HistoryEntry } from '@/types/transcription'
import { Button } from '@/components/ui/button'
import { formatDuration, formatTimestamp } from '@/lib/audio-utils'

interface HistoryCardProps {
  entry: HistoryEntry
  onDelete: (id: string) => void
}

export function HistoryCard({ entry, onDelete }: HistoryCardProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = async () => {
    try {
      if (window.electronAPI?.copyToClipboard) {
        await window.electronAPI.copyToClipboard(entry.cleanedText)
      } else {
        await navigator.clipboard.writeText(entry.cleanedText)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[VoiceFlow] Copy failed:', err)
    }
  }

  return (
    <div className="group animate-fade-in rounded-lg border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p
          className={`text-sm leading-relaxed text-foreground/90 cursor-pointer select-text ${expanded ? '' : 'line-clamp-3'}`}
          onClick={() => setExpanded(prev => !prev)}
          title={expanded ? 'Click to collapse' : 'Click to expand'}
        >
          {entry.cleanedText}
        </p>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(prev => !prev)}>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(entry.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTimestamp(entry.timestamp)}
        </span>
        <span>{formatDuration(entry.duration)}</span>
        <span>{entry.wordCount} words</span>
      </div>
    </div>
  )
}
