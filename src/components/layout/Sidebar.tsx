import { Mic, History, Settings, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

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
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full w-16 flex-col items-center gap-2 border-r border-border/50 bg-card/50 py-4">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <Mic className="h-5 w-5 text-primary" />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate(id)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-all',
                    currentPage === id
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <div className="text-[10px] text-muted-foreground/50">v1.0</div>
      </div>
    </TooltipProvider>
  )
}
