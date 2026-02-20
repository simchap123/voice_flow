import { Trash2, Copy, Check, Clock, ChevronDown, ChevronUp, Download } from 'lucide-react'
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
      console.error('[VoxGen] Copy failed:', err)
    }
  }

  return (
    <div className="group glass-card-hover p-4">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <p
          className={`text-[13px] leading-relaxed text-foreground/85 cursor-pointer select-text ${expanded ? '' : 'line-clamp-3'}`}
          onClick={() => setExpanded(prev => !prev)}
          title={expanded ? 'Click to collapse' : 'Click to expand'}
        >
          {entry.cleanedText}
        </p>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setExpanded(prev => !prev)}>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-lg ${copied ? 'text-primary' : ''}`}
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          {entry.recordingFilename && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => window.electronAPI?.exportRecording(entry.recordingFilename!)}
              title="Save recording"
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-destructive/60 hover:text-destructive"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTimestamp(entry.timestamp)}
        </span>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/20" />
        <span>{formatDuration(entry.duration)}</span>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/20" />
        <span>{entry.wordCount} words</span>
      </div>
    </div>
  )
}
