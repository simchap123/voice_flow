import { Moon, Sun } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface ThemeToggleProps {
  theme: 'dark' | 'light'
  onChange: (theme: 'dark' | 'light') => void
}

export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const isDark = theme === 'dark'

  const toggle = () => {
    const newTheme = isDark ? 'light' : 'dark'
    onChange(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="flex items-center gap-2">
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          Dark Mode
        </Label>
        <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
      </div>
      <Switch checked={isDark} onCheckedChange={toggle} />
    </div>
  )
}
