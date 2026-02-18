import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Info } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'

export function EmailReminder() {
  const { settings, isLoaded } = useSettings()
  const [dismissed, setDismissed] = useState(false)
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  if (!isLoaded || dismissed) return null

  // Don't show if user already has an email or active license
  if (settings.userEmail) return null
  if (settings.licenseStatus === 'active') return null

  // Only show on session 3, 7, or 14+
  const count = (settings as any).sessionCount || 0
  if (count < 3) return null
  if (count > 3 && count < 7) return null
  if (count > 7 && count < 14) return null

  async function handleActivate() {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@') || !window.electronAPI) return

    setChecking(true)
    setError('')

    try {
      const result = await window.electronAPI.validateByEmail(trimmed)
      if (result.valid) {
        setEmail('')
        setDismissed(true)
      } else {
        setError(result.error || 'Could not validate this email')
      }
    } catch {
      setError('Connection failed. Check your internet.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="text-sm font-medium text-blue-300">Enter your email to activate your free trial</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleActivate() }}
          className="text-sm"
        />
        <Button
          onClick={handleActivate}
          disabled={!email.trim() || !email.includes('@') || checking}
          size="sm"
          className="shrink-0"
        >
          {checking ? 'Checking...' : 'Activate'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Your email lets us track your 30-day trial. No spam — just trial status.
      </p>
    </div>
  )
}
