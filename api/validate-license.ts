import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './lib/supabase'
import { isValidEmail } from './lib/validate-email'

const TRIAL_DAYS = 30

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { licenseKey, email } = req.body as { licenseKey?: string; email?: string }

  // Support both email-based and legacy license key validation
  if (email && typeof email === 'string' && isValidEmail(email)) {
    return validateByEmail(email.trim().toLowerCase(), res)
  }

  if (licenseKey && typeof licenseKey === 'string') {
    return validateByKey(licenseKey.trim(), res)
  }

  return res.status(400).json({ error: 'Missing email or licenseKey' })
}

async function validateByEmail(email: string, res: VercelResponse) {
  try {
    // Find user by email
    const { data: user } = await supabase
      .from('users')
      .select('id, trial_started_at')
      .eq('email', email)
      .single()

    if (!user) {
      // New user — create row and start trial immediately
      const now = new Date().toISOString()
      const { error: createErr } = await supabase
        .from('users')
        .upsert(
          { email, trial_started_at: now },
          { onConflict: 'email', ignoreDuplicates: false }
        )

      if (createErr) {
        console.error('[validate-license] Failed to upsert user:', createErr.message)
        return res.status(500).json({ error: 'Failed to create user' })
      }

      return res.status(200).json({
        valid: true,
        plan: 'Trial',
        planSlug: 'trial',
        trialDaysLeft: TRIAL_DAYS,
        expiresAt: null,
      })
    }

    // Existing user — check for active license first
    const { data: license } = await supabase
      .from('user_licenses')
      .select(`
        id,
        status,
        expires_at,
        license_types!inner ( slug, name )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (license) {
      const licenseType = license.license_types as any
      const isLifetime = licenseType.slug === 'lifetime' || licenseType.slug === 'free'
      const now = new Date()

      // Check expiration for non-lifetime plans
      if (!isLifetime && license.expires_at) {
        const expiresAt = new Date(license.expires_at)
        if (expiresAt < now) {
          return res.status(200).json({
            valid: false,
            plan: licenseType.name,
            expiresAt: license.expires_at,
            error: 'License expired',
          })
        }
      }

      return res.status(200).json({
        valid: true,
        plan: licenseType.name,
        planSlug: licenseType.slug,
        expiresAt: license.expires_at,
      })
    }

    // No active license — handle trial
    const trialStartedAt = user.trial_started_at
      ? new Date(user.trial_started_at)
      : null

    if (!trialStartedAt) {
      // Existing user without trial — start trial now
      await supabase
        .from('users')
        .update({ trial_started_at: new Date().toISOString() })
        .eq('id', user.id)

      return res.status(200).json({
        valid: true,
        plan: 'Trial',
        planSlug: 'trial',
        trialDaysLeft: TRIAL_DAYS,
        expiresAt: null,
      })
    }

    const elapsed = Date.now() - trialStartedAt.getTime()
    const daysUsed = elapsed / (1000 * 60 * 60 * 24)
    const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysUsed))

    if (daysLeft <= 0) {
      return res.status(200).json({
        valid: false,
        plan: 'Trial',
        planSlug: 'trial',
        trialDaysLeft: 0,
        error: 'Trial expired',
      })
    }

    return res.status(200).json({
      valid: true,
      plan: 'Trial',
      planSlug: 'trial',
      trialDaysLeft: daysLeft,
      expiresAt: null,
    })
  } catch (err: any) {
    console.error('[validate-license] Email validation error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function validateByKey(licenseKey: string, res: VercelResponse) {
  try {
    const { data, error } = await supabase
      .from('user_licenses')
      .select(`
        id,
        status,
        expires_at,
        license_types!inner ( slug, name )
      `)
      .eq('license_key', licenseKey)
      .single()

    if (error || !data) {
      return res.status(200).json({ valid: false, error: 'License key not found' })
    }

    const licenseType = data.license_types as any
    const isLifetime = licenseType.slug === 'lifetime' || licenseType.slug === 'free'
    const now = new Date()

    // Check if expired (non-lifetime plans)
    if (!isLifetime && data.expires_at) {
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < now) {
        return res.status(200).json({
          valid: false,
          plan: licenseType.name,
          expiresAt: data.expires_at,
          error: 'License expired',
        })
      }
    }

    // Check status
    if (data.status !== 'active') {
      return res.status(200).json({
        valid: false,
        plan: licenseType.name,
        expiresAt: data.expires_at,
        error: `License status: ${data.status}`,
      })
    }

    return res.status(200).json({
      valid: true,
      plan: licenseType.name,
      planSlug: licenseType.slug,
      expiresAt: data.expires_at,
    })
  } catch (err: any) {
    console.error('[validate-license] Key validation error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
