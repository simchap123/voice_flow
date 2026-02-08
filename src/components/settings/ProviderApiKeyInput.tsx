import { useState } from 'react'
import { Eye, EyeOff, Check, Key, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface ProviderApiKeyInputProps {
  provider: string
  label: string
  placeholder: string
  hasKey: boolean
  onSave: (key: string, provider: string) => Promise<{ success: boolean; error?: string }>
  onDelete?: (provider: string) => Promise<void>
}

export function ProviderApiKeyInput({ provider, label, placeholder, hasKey, onSave, onDelete }: ProviderApiKeyInputProps) {
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!onDelete) return
    setError(null)
    await onDelete(provider)
    setDeleted(true)
    setTimeout(() => setDeleted(false), 3000)
  }

  const handleSave = async () => {
    if (!key.trim()) return
    setSaving(true)
    setError(null)
    const result = await onSave(key.trim(), provider)
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
        {label}
      </Label>
      <p className="text-xs text-muted-foreground">
        {hasKey
          ? 'Key saved and encrypted. Enter a new key to replace.'
          : 'Stored securely on your device. Never sent to VoiceFlow servers.'}
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(null) }}
            placeholder={hasKey ? `${placeholder}  (replace)` : placeholder}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-green-500">
            <Check className="h-3 w-3" />
            {deleted ? 'Key deleted' : 'Key configured'}
          </div>
          {onDelete && !deleted && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Delete key
            </button>
          )}
        </div>
      )}
    </div>
  )
}
