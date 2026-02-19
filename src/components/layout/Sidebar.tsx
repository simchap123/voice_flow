import { useState, useEffect } from 'react'
import { History, Settings, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/hooks/useSettings'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'history', icon: History, label: 'History' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [version, setVersion] = useState('')
  const { settings, isManagedMode } = useSettings()

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(setVersion)
  }, [])

  const userEmail = settings.userEmail

  return (
    <div className="flex h-full w-52 flex-col border-r border-border/50 bg-card/50 px-3 py-5">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
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
      {userEmail ? (
        <button
          onClick={() => onNavigate('settings')}
          className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
          title={userEmail}
        >
          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 group-hover:text-foreground/60" />
          <span className="truncate text-xs text-muted-foreground/80 group-hover:text-foreground/80">
            {userEmail}
          </span>
        </button>
      ) : (
        <button
          onClick={() => onNavigate('settings')}
          className="px-2 text-xs text-muted-foreground/60 hover:text-primary transition-colors"
        >
          Sign in
        </button>
      )}
      <div className="mt-1 px-2 text-xs text-muted-foreground/60">
        {version ? `v${version}` : ''}
      </div>
    </div>
  )
}
