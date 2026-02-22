import { supabase } from './supabase'

const TRIAL_DAYS = 30

// Rate limits: requests per hour per user
const RATE_LIMIT_TRIAL = 60     // Trial users: 60 req/hr
const RATE_LIMIT_PAID = 300     // Paid users: 300 req/hr

/**
 * Validate that a user has active trial or license.
 * Shared by proxy-stt and proxy-cleanup endpoints.
 * Also enforces per-user rate limiting.
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
    let isPaid = false
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
      isPaid = true
    } else {
      // Check trial
      if (!user.trial_started_at) {
        // Trial not started = still valid
      } else {
        const elapsed = Date.now() - new Date(user.trial_started_at).getTime()
        const daysUsed = elapsed / (1000 * 60 * 60 * 24)
        if (daysUsed >= TRIAL_DAYS) {
          return { valid: false, error: 'Trial expired' }
        }
      }
    }

    // Rate limiting: count requests in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)

    const limit = isPaid ? RATE_LIMIT_PAID : RATE_LIMIT_TRIAL
    if (count !== null && count >= limit) {
      return { valid: false, error: `Rate limit exceeded (${limit} requests/hour). Try again later.` }
    }

    return { valid: true }
  } catch (err: any) {
    console.error(`[${context}] User validation error:`, err.message)
    return { valid: false, error: 'Validation failed' }
  }
}
