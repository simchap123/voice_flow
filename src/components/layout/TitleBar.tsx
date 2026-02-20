import { Minus, Square, X } from 'lucide-react'

export function TitleBar() {
  const isElectron = !!window.electronAPI

  if (!isElectron) return null

  return (
    <div className="titlebar-drag flex h-9 items-center justify-between bg-[hsl(var(--sidebar))] px-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground/50">
          VoxGen
        </span>
      </div>
      <div className="titlebar-no-drag flex items-center">
        <button
          onClick={() => window.electronAPI?.windowMinimize()}
          className="flex h-7 w-9 items-center justify-center rounded-md transition-colors hover:bg-muted/50"
        >
          <Minus className="h-3 w-3 text-muted-foreground/60" />
        </button>
        <button
          onClick={() => window.electronAPI?.windowMaximize()}
          className="flex h-7 w-9 items-center justify-center rounded-md transition-colors hover:bg-muted/50"
        >
          <Square className="h-2.5 w-2.5 text-muted-foreground/60" />
        </button>
        <button
          onClick={() => window.electronAPI?.windowClose()}
          className="flex h-7 w-9 items-center justify-center rounded-md transition-colors hover:bg-destructive/80 hover:text-white"
        >
          <X className="h-3 w-3 text-muted-foreground/60" />
        </button>
      </div>
    </div>
  )
}
