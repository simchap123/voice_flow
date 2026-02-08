import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_MAP: Record<string, { priceId: string; mode: 'subscription' | 'payment' }> = {
  monthly: { priceId: process.env.STRIPE_PRICE_MONTHLY!, mode: 'subscription' },
  yearly: { priceId: process.env.STRIPE_PRICE_YEARLY!, mode: 'subscription' },
  lifetime: { priceId: process.env.STRIPE_PRICE_LIFETIME!, mode: 'payment' },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { plan, email } = req.body as { plan?: string; email?: string }

  if (!plan || !email) {
    return res.status(400).json({ error: 'Missing plan or email' })
  }

  const priceConfig = PRICE_MAP[plan]
  if (!priceConfig) {
    return res.status(400).json({ error: `Invalid plan: ${plan}` })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voiceflow.app'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: priceConfig.mode,
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceConfig.priceId, quantity: 1 }],
      metadata: { plan },
      success_url: `${appUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#pricing`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err: any) {
    console.error('[checkout] Stripe error:', err.message)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
