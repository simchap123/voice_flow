import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { supabase } from '../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim())
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!.trim()

// Plan slug → license_type slug mapping
const PLAN_TO_LICENSE_TYPE: Record<string, string> = {
  monthly: 'pro_monthly',
  yearly: 'pro_yearly',
  lifetime: 'lifetime',
}

// Duration in days for subscription plans
const PLAN_DURATION_DAYS: Record<string, number | null> = {
  monthly: 30,
  yearly: 365,
  lifetime: null,
}

export const config = {
  api: { bodyParser: false },
}

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature'] as string

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason === 'subscription_cycle') {
          await handleSubscriptionRenewal(invoice)
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err: any) {
    console.error(`[webhook] Error handling ${event.type}:`, err.message)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }

  return res.status(200).json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const rawEmail = session.customer_email || session.customer_details?.email
  const plan = session.metadata?.plan

  if (!rawEmail || !plan) {
    console.error('[webhook] Missing email or plan in session:', session.id)
    return
  }

  const email = rawEmail.trim().toLowerCase()

  const licenseTypeSlug = PLAN_TO_LICENSE_TYPE[plan]
  if (!licenseTypeSlug) {
    console.error('[webhook] Unknown plan:', plan)
    return
  }

  // Upsert user by email
  const { data: user, error: userErr } = await supabase
    .from('users')
    .upsert({ email, external_id: email }, { onConflict: 'email' })
    .select('id')
    .single()

  if (userErr || !user) {
    console.error('[webhook] Failed to upsert user:', userErr?.message)
    return
  }

  // Look up the license type
  const { data: licenseType, error: ltErr } = await supabase
    .from('license_types')
    .select('id, product_id, duration_days')
    .eq('slug', licenseTypeSlug)
    .single()

  if (ltErr || !licenseType) {
    console.error('[webhook] License type not found:', licenseTypeSlug, ltErr?.message)
    return
  }

  // Calculate expiry
  const now = new Date()
  let expiresAt: string | null = null
  const durationDays = PLAN_DURATION_DAYS[plan]
  if (durationDays) {
    const expiry = new Date(now)
    expiry.setDate(expiry.getDate() + durationDays)
    expiresAt = expiry.toISOString()
  }

  // Determine Stripe subscription ID (for recurring plans)
  const stripeSubscriptionId = session.subscription
    ? String(session.subscription)
    : null

  const stripeCustomerId = session.customer
    ? String(session.customer)
    : null

  // Idempotency: check if a license already exists for this session/subscription
  const idempotencyKey = stripeSubscriptionId || session.id
  const { data: existingLicense } = await supabase
    .from('user_licenses')
    .select('id, license_key')
    .eq('user_id', user.id)
    .eq('license_type_id', licenseType.id)
    .or(
      stripeSubscriptionId
        ? `stripe_subscription_id.eq.${stripeSubscriptionId}`
        : `stripe_customer_id.eq.${stripeCustomerId}`
    )
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (existingLicense) {
    console.log(`[webhook] License already exists for ${email} (${plan}), skipping duplicate: ${existingLicense.license_key}`)
    return
  }

  // Insert license
  const { data: license, error: licErr } = await supabase
    .from('user_licenses')
    .insert({
      user_id: user.id,
      product_id: licenseType.product_id,
      license_type_id: licenseType.id,
      status: 'active',
      starts_at: now.toISOString(),
      expires_at: expiresAt,
      auto_renew: plan !== 'lifetime',
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
    })
    .select('license_key')
    .single()

  if (licErr || !license) {
    console.error('[webhook] Failed to create license:', licErr?.message)
    return
  }

  console.log(`[webhook] License created for ${email}: ${license.license_key} (${plan})`)
}

async function handleSubscriptionRenewal(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription
    ? String(invoice.subscription)
    : null

  if (!subscriptionId) {
    console.error('[webhook] Renewal invoice missing subscription ID:', invoice.id)
    return
  }

  // Find the active license for this subscription
  const { data: license, error: findErr } = await supabase
    .from('user_licenses')
    .select('id, license_type_id')
    .eq('stripe_subscription_id', subscriptionId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (findErr || !license) {
    console.error('[webhook] No active license found for subscription:', subscriptionId, findErr?.message)
    return
  }

  // Look up duration from license type
  const { data: licenseType } = await supabase
    .from('license_types')
    .select('duration_days')
    .eq('id', license.license_type_id)
    .single()

  const durationDays = licenseType?.duration_days
  if (!durationDays) {
    console.error('[webhook] No duration for license type:', license.license_type_id)
    return
  }

  // Extend expiry from now
  const newExpiry = new Date()
  newExpiry.setDate(newExpiry.getDate() + durationDays)

  const { error: updateErr } = await supabase
    .from('user_licenses')
    .update({
      expires_at: newExpiry.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', license.id)

  if (updateErr) {
    console.error('[webhook] Failed to extend license:', updateErr.message)
    return
  }

  console.log(`[webhook] License renewed for subscription ${subscriptionId}, new expiry: ${newExpiry.toISOString()}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id

  const { error } = await supabase
    .from('user_licenses')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('[webhook] Failed to cancel license:', error.message)
    return
  }

  console.log(`[webhook] License cancelled for subscription: ${subscriptionId}`)
}
