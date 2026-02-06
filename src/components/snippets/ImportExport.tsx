import { Upload, Download } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import type { Snippet } from '@/types/snippets'

interface ImportExportProps {
  onImport: (snippets: Snippet[]) => void
  onExport: () => void
  hasSnippets: boolean
}

export function ImportExport({ onImport, onExport, hasSnippets }: ImportExportProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (Array.isArray(data)) {
          onImport(data)
        }
      } catch {
        console.error('Invalid snippet file')
      }
    }
    reader.readAsText(file)

    // Reset input
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()}>
        <Upload className="h-3.5 w-3.5" />
        Import
      </Button>
      <input ref={inputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      <Button variant="outline" size="sm" className="gap-1.5" onClick={onExport} disabled={!hasSnippets}>
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
    </div>
  )
}
