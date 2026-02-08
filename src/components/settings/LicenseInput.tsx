import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { LicenseStatus } from '@/types/settings'

interface LicenseInfo {
  licenseKey: string
  licenseStatus: LicenseStatus
  licensePlan: string
  licenseExpiresAt: string
  trialStartedAt: number
  lastLicenseCheck: number
}

export function LicenseInput() {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null)
  const [inputKey, setInputKey] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [trialDaysLeft, setTrialDaysLeft] = useState(7)

  useEffect(() => {
    loadLicenseInfo()
  }, [])

  async function loadLicenseInfo() {
    if (!window.electronAPI) return
    const info = await window.electronAPI.getLicenseInfo()
    setLicenseInfo(info)

    // Calculate trial days left
    if (info.trialStartedAt) {
      const elapsed = Date.now() - info.trialStartedAt
      const daysUsed = elapsed / (1000 * 60 * 60 * 24)
      setTrialDaysLeft(Math.max(0, Math.ceil(7 - daysUsed)))
    }
  }

  async function handleActivate() {
    if (!inputKey.trim() || !window.electronAPI) return

    setChecking(true)
    setError('')

    try {
      const result = await window.electronAPI.validateLicense(inputKey.trim())
      if (result.valid) {
        setInputKey('')
        await loadLicenseInfo()
      } else {
        setError(result.error || 'Invalid license key')
      }
    } catch {
      setError('Failed to validate license. Check your internet connection.')
    } finally {
      setChecking(false)
    }
  }

  async function handleRemove() {
    if (!window.electronAPI) return
    await window.electronAPI.clearLicense()
    setInputKey('')
    setError('')
    await loadLicenseInfo()
  }

  const status = licenseInfo?.licenseStatus || 'none'
  const isActive = status === 'active'
  const isExpired = status === 'expired'
  const isInvalid = status === 'invalid'
  const trialExpired = trialDaysLeft <= 0
  const hasLicense = !!licenseInfo?.licenseKey

  return (
    <div className="space-y-3">
      <Label className="text-base">License</Label>

      {/* Trial info (when no active license) */}
      {!isActive && (
        <div className={`rounded-lg border p-3 ${
          trialExpired
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-border bg-muted/30'
        }`}>
          {trialExpired ? (
            <div className="text-sm">
              <span className="text-red-400 font-medium">Trial expired</span>
              <p className="text-xs text-muted-foreground mt-1">
                Enter a license key below to continue using VoiceFlow, or{' '}
                <a
                  href="https://voiceflow.app/#pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  buy a license
                </a>.
              </p>
            </div>
          ) : (
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Free trial</span>
                <span className="font-medium">{trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${((7 - trialDaysLeft) / 7) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active license display */}
      {isActive && hasLicense && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
                  Active
                </span>
                <span className="text-sm font-medium">{licenseInfo.licensePlan || 'Pro'}</span>
              </div>
              {licenseInfo.licenseExpiresAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires: {new Date(licenseInfo.licenseExpiresAt).toLocaleDateString()}
                </p>
              )}
              {!licenseInfo.licenseExpiresAt && (
                <p className="text-xs text-muted-foreground mt-1">Never expires</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove} className="text-xs text-muted-foreground">
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Expired license display */}
      {isExpired && hasLicense && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-400">
                Expired
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                <a
                  href="https://voiceflow.app/#pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Renew your license
                </a>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove} className="text-xs text-muted-foreground">
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* License key input (when no active license) */}
      {!isActive && (
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Enter license key"
            value={inputKey}
            onChange={(e) => {
              setInputKey(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleActivate() }}
            className="font-mono text-sm"
          />
          <Button
            onClick={handleActivate}
            disabled={!inputKey.trim() || checking}
            size="sm"
            className="shrink-0"
          >
            {checking ? 'Checking...' : 'Activate'}
          </Button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Buy link when no license and not showing trial expired (which already has the link) */}
      {!isActive && !trialExpired && !hasLicense && (
        <p className="text-xs text-muted-foreground">
          <a
            href="https://voiceflow.app/#pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Buy a license
          </a>{' '}
          to support development and unlock all features.
        </p>
      )}
    </div>
  )
}
