import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search transcriptions..."
        className="h-9 rounded-xl border-border/40 bg-card/50 pl-9 text-[13px] placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-primary/20"
      />
    </div>
  )
}
