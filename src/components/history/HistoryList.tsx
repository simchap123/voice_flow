import type { HistoryEntry } from '@/types/transcription'
import { HistoryCard } from './HistoryCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mic } from 'lucide-react'

interface HistoryListProps {
  entries: HistoryEntry[]
  onDelete: (id: string) => void
}

export function HistoryList({ entries, onDelete }: HistoryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
          <Mic className="h-7 w-7 text-primary/30" />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-medium text-muted-foreground/60">No transcriptions yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">
            Press your hotkey to start dictating
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-2 pr-3">
        {entries.map(entry => (
          <HistoryCard key={entry.id} entry={entry} onDelete={onDelete} />
        ))}
      </div>
    </ScrollArea>
  )
}
