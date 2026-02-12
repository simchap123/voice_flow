import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { changelog } from '@/lib/changelog'

export function WhatsNewPage() {
  const [currentVersion, setCurrentVersion] = useState('')

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(v => setCurrentVersion(v))
  }, [])

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">What's New</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Release notes and recent changes
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-6 pr-4">
          {changelog.map((entry, i) => (
            <div
              key={entry.version}
              className="rounded-lg border border-border/50 bg-card/50 p-4"
            >
              <div className="mb-3 flex items-center gap-2.5">
                {i === 0 && (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                <span className="font-semibold">v{entry.version}</span>
                {entry.version === currentVersion && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    current
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{entry.date}</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {entry.highlights.map((item, j) => (
                  <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
