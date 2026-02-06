import { useState } from 'react'
import { Eye, EyeOff, Check, Key, AlertCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface ApiKeyInputProps {
  hasKey: boolean
  onSave: (key: string) => Promise<{ success: boolean; error?: string }>
}

export function ApiKeyInput({ hasKey, onSave }: ApiKeyInputProps) {
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!key.trim()) return
    setSaving(true)
    setError(null)
    const result = await onSave(key.trim())
    setSaving(false)
    if (result.success) {
      setSaved(true)
      setKey('')
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(result.error ?? 'Failed to save API key.')
    }
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
            onChange={(e) => { setKey(e.target.value); setError(null) }}
            placeholder={hasKey ? 'sk-...  (replace existing key)' : 'sk-...'}
            className={`pr-10 ${error ? 'border-red-500/50' : ''}`}
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
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saved ? 'Saved' : saving ? 'Validating...' : 'Save'}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </div>
      )}
      {hasKey && !error && (
        <div className="flex items-center gap-1.5 text-xs text-green-500">
          <Check className="h-3 w-3" />
          API key configured
        </div>
      )}
    </div>
  )
}
