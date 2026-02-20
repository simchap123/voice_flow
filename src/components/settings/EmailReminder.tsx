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
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[13px] font-medium">Enter your email to activate your free trial</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-muted/50 transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground/50" />
        </button>
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleActivate() }}
          className="text-[13px] rounded-xl"
        />
        <Button
          onClick={handleActivate}
          disabled={!email.trim() || !email.includes('@') || checking}
          size="sm"
          className="shrink-0 rounded-xl"
        >
          {checking ? 'Checking...' : 'Activate'}
        </Button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <p className="text-[11px] text-muted-foreground/50">
        Your email lets us track your 30-day trial. No spam — just trial status.
      </p>
    </div>
  )
}
