import { Settings2, Key, User, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

export type SettingsSection = 'general' | 'providers' | 'account' | 'about'

const sections: { id: SettingsSection; icon: typeof Settings2; label: string }[] = [
  { id: 'general', icon: Settings2, label: 'General' },
  { id: 'providers', icon: Key, label: 'Providers' },
  { id: 'account', icon: User, label: 'Account' },
  { id: 'about', icon: Info, label: 'About' },
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
