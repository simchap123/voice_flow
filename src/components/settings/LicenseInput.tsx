import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { LicenseStatus } from '@/types/settings'

interface LicenseInfo {
  licenseKey: string
  licenseStatus: LicenseStatus
  licensePlan: string
  licenseExpiresAt: string
  trialStartedAt: number
  lastLicenseCheck: number
  userEmail: string
}

export function LicenseInput() {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null)
  const [inputEmail, setInputEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')
  const [trialDaysLeft, setTrialDaysLeft] = useState(30)

  useEffect(() => {
    loadLicenseInfo()

    // Listen for deep link auto-activation (voxgen://activate?email=xxx)
    if (window.electronAPI?.onDeepLinkActivated) {
      const unsub = window.electronAPI.onDeepLinkActivated((data) => {
        if (data.valid) {
          loadLicenseInfo()
        }
      })
      return unsub
    }
  }, [])

  async function loadLicenseInfo() {
    if (!window.electronAPI) return
    const info = await window.electronAPI.getLicenseInfo()
    setLicenseInfo(info)

    // Calculate trial days left
    if (info.trialStartedAt) {
      const elapsed = Date.now() - info.trialStartedAt
      const daysUsed = elapsed / (1000 * 60 * 60 * 24)
      setTrialDaysLeft(Math.max(0, Math.floor(30 - daysUsed)))
    }
  }

  async function handleActivate() {
    const email = inputEmail.trim()
    if (!email || !email.includes('@') || !window.electronAPI) return

    setChecking(true)
    setError('')

    try {
      const result = await window.electronAPI.validateByEmail(email)
      if (result.valid) {
        setInputEmail('')
        await loadLicenseInfo()
      } else {
        setError(result.error || 'No active license found for this email')
      }
    } catch {
      setError('Failed to validate. Check your internet connection.')
    } finally {
      setChecking(false)
    }
  }

  async function handleManageSubscription() {
    if (!licenseInfo?.userEmail || !window.electronAPI) return
    setPortalLoading(true)
    try {
      const result = await window.electronAPI.openCustomerPortal(licenseInfo.userEmail)
      if (!result.success) {
        setError(result.error || 'Could not open subscription management')
      }
    } catch {
      setError('Failed to open subscription management')
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleSignOut() {
    if (!window.electronAPI) return
    await window.electronAPI.clearLicense()
    setInputEmail('')
    setError('')
    await loadLicenseInfo()
  }

  const status = licenseInfo?.licenseStatus || 'none'
  const isActive = status === 'active'
  const isExpired = status === 'expired'
  const trialExpired = trialDaysLeft <= 0
  const hasEmail = !!licenseInfo?.userEmail
  const isDeviceTrial = hasEmail && licenseInfo?.userEmail?.endsWith('@device.voxgen.app')
  const isPaidPlan = isActive && licenseInfo?.licensePlan && licenseInfo.licensePlan !== 'Trial'

  return (
    <div className="space-y-3">
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
                Enter the email you used to purchase, or{' '}
                <a
                  href="https://voxgenflow.vercel.app/#pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  buy a license
                </a>{' '}
                to continue with managed API keys.
              </p>
            </div>
          ) : (
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">30-day free trial</span>
                <span className="font-medium">{trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${((30 - trialDaysLeft) / 30) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active license display */}
      {isActive && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
                  Active
                </span>
                <span className="text-sm font-medium">{licenseInfo?.licensePlan || 'Pro'}</span>
              </div>
              {licenseInfo?.userEmail && !isDeviceTrial && (
                <p className="text-xs text-muted-foreground mt-1">{licenseInfo.userEmail}</p>
              )}
              {/* Trial — show days remaining + progress bar */}
              {licenseInfo?.licensePlan === 'Trial' && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining of 30-day free trial
                  </p>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden w-48">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(4, ((30 - trialDaysLeft) / 30) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground/60">
                    After trial,{' '}
                    <a href="https://voxgenflow.vercel.app/#pricing" target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline">upgrade to Pro</a>{' '}
                    or continue with your own API key.
                  </p>
                </div>
              )}
              {licenseInfo?.licenseExpiresAt && licenseInfo?.licensePlan !== 'Trial' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Expires: {new Date(licenseInfo.licenseExpiresAt).toLocaleDateString()}
                </p>
              )}
              {!licenseInfo?.licenseExpiresAt && licenseInfo?.licensePlan !== 'Trial' && (
                <p className="text-xs text-muted-foreground mt-0.5">Never expires</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {licenseInfo?.licenseExpiresAt && !isDeviceTrial && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="text-xs"
                >
                  {portalLoading ? 'Opening...' : 'Manage Subscription'}
                </Button>
              )}
              {!isDeviceTrial && (
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs text-muted-foreground">
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expired license display (paid users only, not device trials) */}
      {isExpired && hasEmail && !isDeviceTrial && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-400">
                Expired
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                <a
                  href="https://voxgenflow.vercel.app/#pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Renew your license
                </a>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs text-muted-foreground">
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Email input — shown when no active license OR when on device trial (to upgrade) */}
      {(!isActive || isDeviceTrial) && (
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={isDeviceTrial ? 'Enter purchase email to upgrade' : 'Enter purchase email'}
            value={inputEmail}
            onChange={(e) => {
              setInputEmail(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleActivate() }}
            className="text-sm"
          />
          <Button
            onClick={handleActivate}
            disabled={!inputEmail.trim() || !inputEmail.includes('@') || checking}
            size="sm"
            className="shrink-0"
          >
            {checking ? 'Checking...' : 'Activate'}
          </Button>
        </div>
      )}

      {/* Error message with buy link when no license found */}
      {error && (
        <div className="text-xs">
          <p className="text-red-400">{error}</p>
          {error.includes('No') && error.includes('license') && (
            <p className="text-muted-foreground mt-1">
              Don't have a license?{' '}
              <a
                href="https://voxgenflow.vercel.app/#pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Buy one now
              </a>{' '}
              — use this email at checkout.
            </p>
          )}
        </div>
      )}

      {/* Buy link when no active paid license */}
      {!isActive && !trialExpired && (
        <p className="text-xs text-muted-foreground">
          <a
            href="https://voxgenflow.vercel.app/#pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Buy a license
          </a>{' '}
          to keep managed API keys after your trial ends.
        </p>
      )}
    </div>
  )
}
