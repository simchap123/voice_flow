import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { licenseKey } = req.body as { licenseKey?: string }

  if (!licenseKey || typeof licenseKey !== 'string') {
    return res.status(400).json({ error: 'Missing licenseKey' })
  }

  try {
    const { data, error } = await supabase
      .from('user_licenses')
      .select(`
        id,
        status,
        expires_at,
        license_types!inner ( slug, name )
      `)
      .eq('license_key', licenseKey.trim())
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
    console.error('[validate-license] Error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
