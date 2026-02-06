import { Trash2, Zap, ArrowRight } from 'lucide-react'
import type { Snippet } from '@/types/snippets'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SnippetsListProps {
  snippets: Snippet[]
  onDelete: (id: string) => void
}

export function SnippetsList({ snippets, onDelete }: SnippetsListProps) {
  if (snippets.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Zap className="h-12 w-12 opacity-30" />
        <p className="text-sm">No snippets yet</p>
        <p className="text-xs">Create trigger words that expand to full text</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-2 pr-4">
        {snippets.map(snippet => (
          <div
            key={snippet.id}
            className="group flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3 transition-colors hover:bg-card/80"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">
                  {snippet.trigger}
                </code>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="truncate text-foreground/80">
                  {snippet.expansion.slice(0, 60)}
                  {snippet.expansion.length > 60 && '...'}
                </span>
              </div>
              {snippet.description && (
                <p className="mt-1 text-xs text-muted-foreground">{snippet.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-destructive"
              onClick={() => onDelete(snippet.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
