import { Minus, Square, X } from 'lucide-react'

export function TitleBar() {
  const isElectron = !!window.electronAPI

  if (!isElectron) return null

  return (
    <div className="titlebar-drag flex h-8 items-center justify-between border-b border-border/50 bg-background/80 px-3">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-primary" />
        <span className="text-xs font-medium text-muted-foreground">VoxGen</span>
      </div>
      <div className="titlebar-no-drag flex items-center gap-1">
        <button
          onClick={() => window.electronAPI?.windowMinimize()}
          className="flex h-6 w-8 items-center justify-center rounded hover:bg-muted"
        >
          <Minus className="h-3 w-3" />
        </button>
        <button
          onClick={() => window.electronAPI?.windowMaximize()}
          className="flex h-6 w-8 items-center justify-center rounded hover:bg-muted"
        >
          <Square className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={() => window.electronAPI?.windowClose()}
          className="flex h-6 w-8 items-center justify-center rounded hover:bg-destructive/80 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
