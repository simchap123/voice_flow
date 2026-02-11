import { supabase } from './supabase'

const TRIAL_DAYS = 30

/**
 * Validate that a user has active trial or license.
 * Shared by proxy-stt and proxy-cleanup endpoints.
 */
export async function validateUser(
  email: string,
  context = 'proxy'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, trial_started_at')
      .eq('email', email)
      .single()

    if (!user) {
      return { valid: false, error: 'User not found. Enter your email in Settings to start a trial.' }
    }

    // Check for active license first
    const { data: license } = await supabase
      .from('user_licenses')
      .select('id, status, expires_at, license_types!inner ( slug )')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (license) {
      const licenseType = license.license_types as any
      const isLifetime = licenseType.slug === 'lifetime' || licenseType.slug === 'free'

      if (!isLifetime && license.expires_at) {
        if (new Date(license.expires_at) < new Date()) {
          return { valid: false, error: 'License expired' }
        }
      }
      return { valid: true }
    }

    // Check trial
    if (!user.trial_started_at) {
      return { valid: true } // Trial not started = still valid (will start now)
    }

    const elapsed = Date.now() - new Date(user.trial_started_at).getTime()
    const daysUsed = elapsed / (1000 * 60 * 60 * 24)
    if (daysUsed >= TRIAL_DAYS) {
      return { valid: false, error: 'Trial expired' }
    }

    return { valid: true }
  } catch (err: any) {
    console.error(`[${context}] User validation error:`, err.message)
    return { valid: false, error: 'Validation failed' }
  }
}
