import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { supabase } from './lib/supabase'
import { isValidEmail } from './lib/validate-email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim())

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email: rawEmail } = req.body as { email?: string }

  if (!rawEmail || !isValidEmail(rawEmail)) {
    return res.status(400).json({ error: 'Valid email required' })
  }

  const email = rawEmail.trim().toLowerCase()

  try {
    // Find user's Stripe customer ID from their license
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'No account found for this email' })
    }

    const { data: license } = await supabase
      .from('user_licenses')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!license?.stripe_customer_id) {
      return res.status(404).json({ error: 'No billing account found. Lifetime licenses do not have recurring billing.' })
    }

    const appUrl = (process.env.APP_URL || 'https://voxgenflow.vercel.app').trim().replace(/\/+$/, '')

    const session = await stripe.billingPortal.sessions.create({
      customer: license.stripe_customer_id,
      return_url: appUrl,
    })

    return res.status(200).json({ url: session.url })
  } catch (err: any) {
    console.error('[customer-portal] Error:', err.message)
    return res.status(500).json({ error: 'Failed to create portal session' })
  }
}
