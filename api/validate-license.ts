import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './lib/supabase'
import { isValidEmail } from './lib/validate-email'

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
      // No user found — don't auto-create. User must purchase first.
      return res.status(200).json({
        valid: false,
        error: 'No license found for this email',
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
