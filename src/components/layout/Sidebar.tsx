import { useState, useEffect, useRef } from 'react'
import { History, Settings, Mic, MessageSquare, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useSettings } from '@/hooks/useSettings'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const mainNav = [
  { id: 'history', icon: History, label: 'History' },
]

const modeNav = [
  { id: 'dictation', icon: MessageSquare, label: 'Dictation' },
  { id: 'ai-prompt', icon: Zap, label: 'AI Prompt' },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [version, setVersion] = useState('')
  const [showSettingsBtn, setShowSettingsBtn] = useState(false)
  const footerRef = useRef<HTMLDivElement>(null)
  const { settings } = useSettings()

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(setVersion)
  }, [])

  // Close the slide-up when clicking outside or navigating
  useEffect(() => {
    if (!showSettingsBtn) return
    function handleClick(e: MouseEvent) {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
        setShowSettingsBtn(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSettingsBtn])

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
      <div ref={footerRef} className="mt-auto border-t border-border/30 pt-3">
        {/* Slide-up Settings button */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-200 ease-out',
            showSettingsBtn ? 'max-h-10 opacity-100 mb-1' : 'max-h-0 opacity-0'
          )}
        >
          <button
            onClick={() => {
              onNavigate('settings')
              setShowSettingsBtn(false)
            }}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150',
              currentPage === 'settings'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Settings className="h-[15px] w-[15px] shrink-0" />
            Settings
          </button>
        </div>

        {userEmail ? (
          <button
            onClick={() => setShowSettingsBtn((v) => !v)}
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
            onClick={() => setShowSettingsBtn((v) => !v)}
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
