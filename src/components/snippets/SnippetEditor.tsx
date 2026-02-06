import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

interface SnippetEditorProps {
  onAdd: (trigger: string, expansion: string, description: string) => void
}

export function SnippetEditor({ onAdd }: SnippetEditorProps) {
  const [trigger, setTrigger] = useState('')
  const [expansion, setExpansion] = useState('')
  const [description, setDescription] = useState('')

  const handleAdd = () => {
    if (!trigger.trim() || !expansion.trim()) return
    onAdd(trigger.trim(), expansion.trim(), description.trim())
    setTrigger('')
    setExpansion('')
    setDescription('')
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-card/50 p-4">
      <h3 className="text-sm font-medium">Add Snippet</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Trigger word</Label>
          <Input
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder='e.g. "sign off"'
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description (optional)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Email signature"
            className="h-9"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Expands to</Label>
        <textarea
          value={expansion}
          onChange={(e) => setExpansion(e.target.value)}
          placeholder="Best regards,&#10;John Doe"
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button onClick={handleAdd} disabled={!trigger.trim() || !expansion.trim()} size="sm" className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add Snippet
      </Button>
    </div>
  )
}
