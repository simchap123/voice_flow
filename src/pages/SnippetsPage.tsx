import { useSnippets } from '@/hooks/useSnippets'
import { SnippetEditor } from '@/components/snippets/SnippetEditor'
import { SnippetsList } from '@/components/snippets/SnippetsList'
import { ImportExport } from '@/components/snippets/ImportExport'

export function SnippetsPage() {
  const { snippets, addSnippet, deleteSnippet, importSnippets, exportSnippets } = useSnippets()

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Snippets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create trigger words that expand to full text during dictation
          </p>
        </div>
        <ImportExport
          onImport={importSnippets}
          onExport={exportSnippets}
          hasSnippets={snippets.length > 0}
        />
      </div>

      <SnippetEditor onAdd={addSnippet} />

      <SnippetsList snippets={snippets} onDelete={deleteSnippet} />
    </div>
  )
}
