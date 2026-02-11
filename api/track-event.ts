import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './lib/supabase'

const VALID_EVENT_TYPES = ['app_launch', 'app_error', 'feature_used']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { deviceId, email, eventType, payload, appVersion, platform } = req.body as {
    deviceId?: string
    email?: string
    eventType?: string
    payload?: Record<string, unknown>
    appVersion?: string
    platform?: string
  }

  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({ error: 'Missing deviceId' })
  }

  if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
    return res.status(400).json({ error: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` })
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

    const { error: insertErr } = await supabase
      .from('events')
      .insert({
        device_id: deviceId,
        user_id: userId,
        event_type: eventType,
        payload: payload ?? {},
        app_version: appVersion ?? null,
        platform: platform ?? null,
      })

    if (insertErr) {
      console.error('[track-event] Insert error:', insertErr.message)
      return res.status(500).json({ error: 'Failed to log event' })
    }

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('[track-event] Error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
