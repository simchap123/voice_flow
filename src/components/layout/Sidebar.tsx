import { useState, useEffect } from 'react'
import { History, Settings, Mic, MessageSquare, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useSettings } from '@/hooks/useSettings'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const mainNav = [
  { id: 'history', icon: History, label: 'History' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

const modeNav = [
  { id: 'dictation', icon: MessageSquare, label: 'Dictation' },
  { id: 'ai-prompt', icon: Zap, label: 'AI Prompt' },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [version, setVersion] = useState('')
  const { settings } = useSettings()

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(setVersion)
  }, [])

  const userEmail = settings.userEmail
  const licensePlan = settings.licensePlan

  // Get display name from email
  const displayName = userEmail
    ? userEmail.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    : ''
  const initials = userEmail
    ? userEmail.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase()).join('').slice(0, 2)
    : '?'

  return (
    <div className="flex h-full w-[200px] flex-col border-r border-border/30 bg-[hsl(var(--sidebar))] px-3 pt-3 pb-3">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2.5 px-2 pt-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Mic className="h-[14px] w-[14px] text-white" />
        </div>
        <span className="text-[14px] font-bold tracking-tight">VoxGen</span>
      </div>

      {/* Main Nav */}
      <nav className="flex flex-1 flex-col gap-0.5">
        {mainNav.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150',
              currentPage === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Icon className="h-[15px] w-[15px] shrink-0" />
            {label}
          </button>
        ))}

        {/* Modes separator */}
        <p className="mt-4 mb-1 px-3 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">
          Modes
        </p>

        {modeNav.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150',
              currentPage === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Icon className="h-[15px] w-[15px] shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-border/30 pt-3">
        {userEmail ? (
          <button
            onClick={() => onNavigate('settings')}
            className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
            title={userEmail}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-[10px] font-bold text-primary">
                {initials}
              </span>
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-[12px] font-semibold text-foreground/80">
                {displayName}
              </p>
              {licensePlan && (
                <p className="text-[10px] text-muted-foreground/50 capitalize">
                  {licensePlan} Plan
                </p>
              )}
            </div>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('settings')}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12px] text-muted-foreground/60 transition-colors hover:text-primary"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/50">
              <span className="text-[10px] font-medium">?</span>
            </div>
            Sign in
          </button>
        )}
      </div>
    </div>
  )
}
