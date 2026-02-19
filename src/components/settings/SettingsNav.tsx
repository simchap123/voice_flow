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
    <nav className="flex w-44 shrink-0 flex-col gap-1 border-r border-border/50 p-3">
      {sections.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            active === id
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </button>
      ))}
    </nav>
  )
}
