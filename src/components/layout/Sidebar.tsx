import { useState, useEffect } from 'react'
import { Mic, History, Settings, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'dictation', icon: Mic, label: 'Dictation' },
  { id: 'history', icon: History, label: 'History' },
  { id: 'snippets', icon: Zap, label: 'Snippets' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(setVersion)
  }, [])

  return (
    <div className="flex h-full w-52 flex-col border-r border-border/50 bg-card/50 px-3 py-5">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-500">
          <Mic className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight">VoxGen</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              currentPage === id
                ? 'border-l-[3px] border-primary bg-primary/10 text-primary'
                : 'border-l-[3px] border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <Separator className="mb-3" />
      <div className="px-2 text-xs text-muted-foreground/60">
        {version ? `v${version}` : ''}
      </div>
    </div>
  )
}
