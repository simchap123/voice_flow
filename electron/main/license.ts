import { net } from 'electron'
import {
  getSetting,
  setSetting,
  saveLicenseResult,
  getTrialInfo,
  getLicenseInfo,
  type LicenseStatus,
} from './store'

const API_BASE = 'https://freevoiceflow.vercel.app'
const REVALIDATION_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface LicenseValidationResult {
  valid: boolean
  plan?: string
  planSlug?: string
  expiresAt?: string | null
  trialDaysLeft?: number
  error?: string
}

export async function validateByEmail(email: string): Promise<LicenseValidationResult> {
  try {
    const response = await netFetch(`${API_BASE}/api/validate-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    })

    const data = JSON.parse(response)

    if (data.valid) {
      saveLicenseResult({
        licenseKey: email.trim().toLowerCase(),
        status: 'active',
        plan: data.plan || '',
        expiresAt: data.expiresAt || '',
      })
      setSetting('userEmail', email.trim().toLowerCase())
    } else {
      saveLicenseResult({
        licenseKey: email.trim().toLowerCase(),
        status: data.error?.includes('expired') ? 'expired' : 'invalid',
        plan: data.plan || '',
        expiresAt: data.expiresAt || '',
      })
      setSetting('userEmail', email.trim().toLowerCase())
    }

    return data
  } catch (err: any) {
    console.error('[VoxGen] Email validation failed:', err.message)
    // On network failure, use cached result
    const cached = getLicenseInfo()
    if (cached.licenseKey === email.trim().toLowerCase() && cached.licenseStatus === 'active') {
      return {
        valid: true,
        plan: cached.licensePlan,
        expiresAt: cached.licenseExpiresAt || null,
      }
    }
    return { valid: false, error: 'Unable to validate license. Check your internet connection.' }
  }
}

// Legacy key-based validation (backwards compatibility)
export async function validateLicenseKey(key: string): Promise<LicenseValidationResult> {
  // If it looks like an email, use email validation
  if (key.includes('@')) {
    return validateByEmail(key)
  }

  try {
    const response = await netFetch(`${API_BASE}/api/validate-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: key.trim() }),
    })

    const data = JSON.parse(response)

    if (data.valid) {
      saveLicenseResult({
        licenseKey: key.trim(),
        status: 'active',
        plan: data.plan || '',
        expiresAt: data.expiresAt || '',
      })
    } else {
      saveLicenseResult({
        licenseKey: key.trim(),
        status: data.error?.includes('expired') ? 'expired' : 'invalid',
        plan: data.plan || '',
        expiresAt: data.expiresAt || '',
      })
    }

    return data
  } catch (err: any) {
    console.error('[VoxGen] License validation failed:', err.message)
    const cached = getLicenseInfo()
    if (cached.licenseKey === key.trim() && cached.licenseStatus === 'active') {
      return {
        valid: true,
        plan: cached.licensePlan,
        expiresAt: cached.licenseExpiresAt || null,
      }
    }
    return { valid: false, error: 'Unable to validate license. Check your internet connection.' }
  }
}

export async function checkLicenseOnStartup(): Promise<void> {
  // Try email-based validation first
  const email = getSetting('userEmail')
  if (email) {
    const lastCheck = getSetting('lastLicenseCheck')
    const elapsed = Date.now() - lastCheck
    if (elapsed < REVALIDATION_INTERVAL_MS) {
      console.log('[VoxGen] License check skipped (cached)')
      return
    }
    console.log('[VoxGen] Revalidating license by email on startup...')
    await validateByEmail(email)
    return
  }

  // Fallback to legacy key-based validation
  const key = getSetting('licenseKey')
  if (!key) return

  const lastCheck = getSetting('lastLicenseCheck')
  const elapsed = Date.now() - lastCheck

  if (elapsed < REVALIDATION_INTERVAL_MS) {
    console.log('[VoxGen] License check skipped (cached)')
    return
  }

  console.log('[VoxGen] Revalidating license on startup...')
  await validateLicenseKey(key)
}

export function canUseApp(): boolean {
  // If license is active, always allow
  const status = getSetting('licenseStatus') as LicenseStatus
  if (status === 'active') return true

  // Otherwise check trial (local fallback for offline scenarios)
  const trial = getTrialInfo()
  return !trial.isExpired
}

// Simple fetch using Electron's net module
function netFetch(url: string, options: { method: string; headers: Record<string, string>; body: string }): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request({
      url,
      method: options.method,
    })

    for (const [key, value] of Object.entries(options.headers)) {
      request.setHeader(key, value)
    }

    let responseData = ''

    request.on('response', (response) => {
      response.on('data', (chunk: Buffer) => {
        responseData += chunk.toString()
      })
      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve(responseData)
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${responseData}`))
        }
      })
    })

    request.on('error', (err) => {
      reject(err)
    })

    request.write(options.body)
    request.end()
  })
}
