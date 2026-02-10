import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { supabase } from './lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sessionId = req.query.session_id as string

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session_id' })
  }

  try {
    // Retrieve Stripe session to get customer email
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const email = session.customer_email || session.customer_details?.email
    if (!email) {
      return res.status(404).json({ error: 'No email associated with session' })
    }

    // Find the user and their most recent license
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'User not found. License may still be processing.' })
    }

    const { data: license } = await supabase
      .from('user_licenses')
      .select(`
        status,
        expires_at,
        license_types!inner ( name, slug )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!license) {
      return res.status(404).json({ error: 'License not found. It may take a moment to process.' })
    }

    const licenseType = license.license_types as any

    return res.status(200).json({
      email: email,
      plan: licenseType.name,
      planSlug: licenseType.slug,
      expiresAt: license.expires_at,
    })
  } catch (err: any) {
    console.error('[get-license] Error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
