import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './lib/supabase'
import { isValidEmail } from './lib/validate-email'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email: rawEmail, path } = req.body as { email?: string; path?: string }

  if (!rawEmail || !isValidEmail(rawEmail)) {
    return res.status(400).json({ error: 'A valid email is required' })
  }

  const email = rawEmail.trim().toLowerCase()
  const VALID_PATHS = ['free', 'pro', 'free-download-page']
  const leadPath = VALID_PATHS.includes(path ?? '') ? path! : 'free'

  try {
    await supabase.from('leads').insert({ email, path: leadPath })
    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('[capture-lead] Error:', err.message)
    return res.status(500).json({ error: 'Failed to save lead' })
  }
}
