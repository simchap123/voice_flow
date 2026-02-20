import { Mic, Cpu, MessageSquare, Zap, User } from 'lucide-react'
import { cn } from '@/lib/cn'

export type SettingsSection = 'recording' | 'ai-processing' | 'prompts' | 'power-modes' | 'account'

const sections: { id: SettingsSection; icon: typeof Mic; label: string }[] = [
  { id: 'recording', icon: Mic, label: 'Recording' },
  { id: 'ai-processing', icon: Cpu, label: 'AI Processing' },
  { id: 'prompts', icon: MessageSquare, label: 'Prompts' },
  { id: 'power-modes', icon: Zap, label: 'Power Modes' },
  { id: 'account', icon: User, label: 'Account' },
]

interface SettingsNavProps {
  active: SettingsSection
  onSelect: (section: SettingsSection) => void
}

export function SettingsNav({ active, onSelect }: SettingsNavProps) {
  return (
    <nav className="flex w-[170px] shrink-0 flex-col gap-0.5 border-r border-border/30 p-3">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
        Settings
      </p>
      {sections.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150',
            active === id
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <Icon className="h-[15px] w-[15px] shrink-0" />
          {label}
        </button>
      ))}
    </nav>
  )
}
