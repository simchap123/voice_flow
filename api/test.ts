export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    env: {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasMonthlyPrice: !!process.env.STRIPE_PRICE_MONTHLY,
      nodeVersion: process.version,
    }
  })
}
