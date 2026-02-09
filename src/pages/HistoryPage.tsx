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
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">History</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.electronAPI?.openRecordingsFolder()}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Recordings
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={exportHistory}
            disabled={allHistory.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive"
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
