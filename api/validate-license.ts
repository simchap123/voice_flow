import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './lib/supabase'
import { isValidEmail } from './lib/validate-email'

const TRIAL_DAYS = 30

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { licenseKey, email, deviceId } = req.body as {
    licenseKey?: string
    email?: string
    deviceId?: string
  }

  // 1. Email-based validation (for paid licenses only)
  if (email && typeof email === 'string' && isValidEmail(email)) {
    return validateByEmail(email.trim().toLowerCase(), res)
  }

  // 2. Device-based trial (no email needed)
  if (deviceId && typeof deviceId === 'string' && deviceId.length >= 8) {
    return validateByDevice(deviceId.trim(), res)
  }

  // 3. Legacy license key validation
  if (licenseKey && typeof licenseKey === 'string') {
    return validateByKey(licenseKey.trim(), res)
  }

  return res.status(400).json({ error: 'Missing email, deviceId, or licenseKey' })
}

// Device-based trial: one 30-day trial per device, no email needed
async function validateByDevice(deviceId: string, res: VercelResponse) {
  try {
    // Check if device already has a trial user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, trial_started_at')
      .eq('device_id', deviceId)
      .single()

    if (existingUser) {
      // Device already registered — check trial status
      const trialStartedAt = existingUser.trial_started_at
        ? new Date(existingUser.trial_started_at)
        : null

      if (!trialStartedAt) {
        // Shouldn't happen, but handle gracefully — start trial now
        await supabase
          .from('users')
          .update({ trial_started_at: new Date().toISOString() })
          .eq('id', existingUser.id)

        return res.status(200).json({
          valid: true,
          plan: 'Trial',
          planSlug: 'trial',
          trialDaysLeft: TRIAL_DAYS,
          trialEmail: existingUser.email,
          expiresAt: null,
        })
      }

      // Check if also has a paid license (user may have upgraded)
      const { data: license } = await supabase
        .from('user_licenses')
        .select(`id, status, expires_at, license_types!inner ( slug, name )`)
        .eq('user_id', existingUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (license) {
        const licenseType = license.license_types as any
        return res.status(200).json({
          valid: true,
          plan: licenseType.name,
          planSlug: licenseType.slug,
          trialEmail: existingUser.email,
          expiresAt: license.expires_at,
        })
      }

      // Check trial expiration
      const elapsed = Date.now() - trialStartedAt.getTime()
      const daysUsed = elapsed / (1000 * 60 * 60 * 24)
      const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysUsed))

      if (daysLeft <= 0) {
        return res.status(200).json({
          valid: false,
          plan: 'Trial',
          planSlug: 'trial',
          trialDaysLeft: 0,
          trialEmail: existingUser.email,
          error: 'Trial expired',
        })
      }

      return res.status(200).json({
        valid: true,
        plan: 'Trial',
        planSlug: 'trial',
        trialDaysLeft: daysLeft,
        trialEmail: existingUser.email,
        expiresAt: null,
      })
    }

    // New device — create trial user with generated email
    const shortId = deviceId.replace(/-/g, '').slice(0, 12)
    const trialEmail = `trial_${shortId}@device.voxgen.app`
    const now = new Date().toISOString()

    const { error: createErr } = await supabase
      .from('users')
      .insert({
        email: trialEmail,
        device_id: deviceId,
        trial_started_at: now,
      })

    if (createErr) {
      // Might be a race condition — try to fetch again
      console.error('[validate-license] Device trial create error:', createErr.message)
      const { data: retryUser } = await supabase
        .from('users')
        .select('id, email, trial_started_at')
        .eq('device_id', deviceId)
        .single()

      if (retryUser) {
        return res.status(200).json({
          valid: true,
          plan: 'Trial',
          planSlug: 'trial',
          trialDaysLeft: TRIAL_DAYS,
          trialEmail: retryUser.email,
          expiresAt: null,
        })
      }
      return res.status(500).json({ error: 'Failed to register device trial' })
    }

    return res.status(200).json({
      valid: true,
      plan: 'Trial',
      planSlug: 'trial',
      trialDaysLeft: TRIAL_DAYS,
      trialEmail,
      expiresAt: null,
    })
  } catch (err: any) {
    console.error('[validate-license] Device validation error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
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
      // No user found — don't auto-create. User must purchase first.
      return res.status(200).json({
        valid: false,
        error: 'No license found for this email',
      })
    }

    // Existing user — check for active license
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

    // User exists but has no active license
    return res.status(200).json({
      valid: false,
      error: 'No active license for this email',
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
