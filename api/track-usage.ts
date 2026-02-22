import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, deviceId, words, audioSeconds, sttProvider, cleanupProvider, language } = req.body as {
    email?: string
    deviceId?: string
    words?: number
    audioSeconds?: number
    sttProvider?: string
    cleanupProvider?: string
    language?: string
  }

  // Require at least a deviceId or email for tracking
  if (!deviceId && !email) {
    return res.status(400).json({ error: 'Missing deviceId or email' })
  }

  try {
    // Optionally resolve user_id from email
    let userId: string | null = null
    if (email && typeof email === 'string') {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .single()
      if (user) userId = user.id
    }

    // Sanitize numeric fields to prevent abuse
    const safeWords = Math.max(0, Math.min(Number(words) || 0, 100_000))
    const safeAudioSeconds = Math.max(0, Math.min(Number(audioSeconds) || 0, 3600))

    // Insert usage log
    const { error: insertErr } = await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        device_id: deviceId ?? null,
        words: safeWords,
        audio_seconds: safeAudioSeconds,
        stt_provider: (sttProvider ?? 'unknown').slice(0, 50),
        cleanup_provider: (cleanupProvider ?? 'none').slice(0, 50),
        language: (language ?? 'en').slice(0, 10),
      })

    if (insertErr) {
      console.error('[track-usage] Insert error:', insertErr.message)
      return res.status(500).json({ error: 'Failed to log usage' })
    }

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('[track-usage] Error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
