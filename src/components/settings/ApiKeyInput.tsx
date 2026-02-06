import { useState } from 'react'
import { Eye, EyeOff, Check, Key } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface ApiKeyInputProps {
  hasKey: boolean
  onSave: (key: string) => Promise<void>
}

export function ApiKeyInput({ hasKey, onSave }: ApiKeyInputProps) {
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!key.trim()) return
    setSaving(true)
    await onSave(key.trim())
    setSaving(false)
    setSaved(true)
    setKey('')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Key className="h-4 w-4" />
        OpenAI API Key
      </Label>
      <p className="text-xs text-muted-foreground">
        {hasKey
          ? 'API key is saved and encrypted. Enter a new key to replace it.'
          : 'Required for transcription. Stored securely on your device.'}
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={hasKey ? 'sk-...  (replace existing key)' : 'sk-...'}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button onClick={handleSave} disabled={!key.trim() || saving} className="gap-1.5">
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? 'Saved' : saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
      {hasKey && (
        <div className="flex items-center gap-1.5 text-xs text-green-500">
          <Check className="h-3 w-3" />
          API key configured
        </div>
      )}
    </div>
  )
}
