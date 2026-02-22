import { net, BrowserWindow } from 'electron'
import {
  getSetting,
  setSetting,
  saveLicenseResult,
  getTrialInfo,
  getLicenseInfo,
  getDeviceId,
  type LicenseStatus,
} from './store'

const API_BASE = 'https://voxgenflow.vercel.app'
const REVALIDATION_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

// Startup grace: allow usage while initial license check is in progress
let startupCheckComplete = false

export interface LicenseValidationResult {
  valid: boolean
  plan?: string
  planSlug?: string
  expiresAt?: string | null
  trialDaysLeft?: number
  trialEmail?: string
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
      // Don't persist email on failed validation — prevents invalid managed mode
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

// Device-based trial: register device with server to get managed API access
export async function registerDeviceTrial(deviceId: string): Promise<LicenseValidationResult> {
  try {
    const response = await netFetch(`${API_BASE}/api/validate-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    })

    const data = JSON.parse(response) as LicenseValidationResult

    if (data.valid && data.trialEmail) {
      // Store the generated trial email so managed mode works
      setSetting('userEmail', data.trialEmail)
      saveLicenseResult({
        licenseKey: data.trialEmail,
        status: 'active',
        plan: data.plan || 'Trial',
        expiresAt: data.expiresAt || '',
      })
      // Broadcast to all renderer windows so managed mode activates
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send('setting-changed', 'userEmail', data.trialEmail)
        }
      }
      console.log('[VoxGen] Device trial registered, email:', data.trialEmail, 'days left:', data.trialDaysLeft)
    } else if (data.valid === false && data.trialDaysLeft === 0) {
      // Trial expired on server
      saveLicenseResult({
        licenseKey: data.trialEmail || '',
        status: 'expired',
        plan: 'Trial',
        expiresAt: '',
      })
      console.log('[VoxGen] Device trial expired')
    }

    return data
  } catch (err: any) {
    console.error('[VoxGen] Device trial registration failed:', err.message)
    // Offline — fall back to local trial check
    return { valid: !getTrialInfo().isExpired, plan: 'Trial', trialDaysLeft: getTrialInfo().daysLeft }
  }
}

export async function checkLicenseOnStartup(): Promise<void> {
  try {
    return await _checkLicenseOnStartupInner()
  } finally {
    startupCheckComplete = true
  }
}

async function _checkLicenseOnStartupInner(): Promise<void> {
  // Try email-based validation first (paid users or already-registered device trials)
  const email = getSetting('userEmail')
  if (email) {
    // If this is a device trial email, re-validate by device instead
    if (email.endsWith('@device.voxgen.app')) {
      const deviceId = getDeviceId()
      if (deviceId && deviceId !== 'unknown') {
        const lastCheck = getSetting('lastLicenseCheck')
        const elapsed = Date.now() - lastCheck
        if (elapsed < REVALIDATION_INTERVAL_MS) {
          console.log('[VoxGen] Device trial check skipped (cached)')
          return
        }
        console.log('[VoxGen] Revalidating device trial on startup...')
        await registerDeviceTrial(deviceId)
        return
      }
    }

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

  // No email set — auto-register device trial for managed mode
  const deviceId = getDeviceId()
  if (deviceId && deviceId !== 'unknown') {
    const trial = getTrialInfo()
    if (!trial.isExpired) {
      console.log('[VoxGen] No email set — registering device trial for managed mode...')
      await registerDeviceTrial(deviceId)
      return
    }
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
  // During startup, allow usage while initial license check is in progress
  // This prevents blocking users who press hotkey before async check completes
  if (!startupCheckComplete) return true

  // If license is active, always allow
  const status = getSetting('licenseStatus') as LicenseStatus
  if (status === 'active') return true

  // Otherwise check trial (local fallback for offline scenarios)
  const trial = getTrialInfo()
  return !trial.isExpired
}

// JSON fetch helper — used by ipc-handlers for customer-portal etc.
export async function netFetchJson(url: string, options: { method: string; headers: Record<string, string>; body: string }): Promise<any> {
  const raw = await netFetch(url, options)
  return JSON.parse(raw)
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
