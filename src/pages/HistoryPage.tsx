import { useTranscriptionHistory } from '@/hooks/useTranscriptionHistory'
import { HistoryList } from '@/components/history/HistoryList'
import { SearchBar } from '@/components/history/SearchBar'
import { Button } from '@/components/ui/button'
import { Download, Trash2, FolderOpen } from 'lucide-react'

export function HistoryPage() {
  const {
    history,
    allHistory,
    searchQuery,
    setSearchQuery,
    deleteEntry,
    clearHistory,
    exportHistory,
  } = useTranscriptionHistory()

  return (
    <div className="page-enter flex h-full flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">History</h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {allHistory.length > 0
              ? `${allHistory.length} transcription${allHistory.length !== 1 ? 's' : ''}`
              : 'Your transcriptions will appear here'}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
            onClick={() => window.electronAPI?.openRecordingsFolder()}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Recordings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
            onClick={exportHistory}
            disabled={allHistory.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-[12px] text-destructive/70 hover:text-destructive"
            onClick={clearHistory}
            disabled={allHistory.length === 0}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <HistoryList entries={history} onDelete={deleteEntry} />
    </div>
  )
}
