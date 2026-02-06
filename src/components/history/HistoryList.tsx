import type { HistoryEntry } from '@/types/transcription'
import { HistoryCard } from './HistoryCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { History } from 'lucide-react'

interface HistoryListProps {
  entries: HistoryEntry[]
  onDelete: (id: string) => void
}

export function HistoryList({ entries, onDelete }: HistoryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <History className="h-12 w-12 opacity-30" />
        <p className="text-sm">No transcriptions yet</p>
        <p className="text-xs">Press Alt+Space to start dictating</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-2 pr-4">
        {entries.map(entry => (
          <HistoryCard key={entry.id} entry={entry} onDelete={onDelete} />
        ))}
      </div>
    </ScrollArea>
  )
}
