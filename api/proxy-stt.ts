import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { supabase } from './lib/supabase'

const GROQ_API_KEY = process.env.GROQ_API_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!GROQ_API_KEY) {
    console.error('[proxy-stt] GROQ_API_KEY not configured')
    return res.status(500).json({ error: 'Proxy not configured' })
  }

  const { email, audio, language, mimeType } = req.body as {
    email?: string
    audio?: string // base64-encoded audio
    language?: string
    mimeType?: string
  }

  if (!email || !audio) {
    return res.status(400).json({ error: 'Missing email or audio' })
  }

  // Validate user has active trial or license
  const validation = await validateUser(email.trim().toLowerCase())
  if (!validation.valid) {
    return res.status(403).json({ error: validation.error || 'Access denied' })
  }

  try {
    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64')
    const audioFile = new File(
      [audioBuffer],
      'recording.webm',
      { type: mimeType || 'audio/webm' }
    )

    // Call Groq Whisper via OpenAI-compatible API
    const client = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const response = await client.audio.transcriptions.create({
      model: 'whisper-large-v3-turbo',
      file: audioFile,
      language: language === 'auto' ? undefined : language,
    })

    return res.status(200).json({ text: response.text })
  } catch (err: any) {
    console.error('[proxy-stt] Transcription error:', err.message)
    return res.status(500).json({ error: 'Transcription failed' })
  }
}

async function validateUser(email: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, trial_started_at')
      .eq('email', email)
      .single()

    if (!user) {
      return { valid: false, error: 'User not found. Enter your email in Settings to start a trial.' }
    }

    // Check for active license first
    const { data: license } = await supabase
      .from('user_licenses')
      .select('id, status, expires_at, license_types!inner ( slug )')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (license) {
      const licenseType = license.license_types as any
      const isLifetime = licenseType.slug === 'lifetime' || licenseType.slug === 'free'

      // Lifetime/free licenses with BYOK don't need proxy — but allow it anyway
      if (!isLifetime && license.expires_at) {
        if (new Date(license.expires_at) < new Date()) {
          return { valid: false, error: 'License expired' }
        }
      }
      return { valid: true }
    }

    // Check trial
    if (!user.trial_started_at) {
      return { valid: true } // Trial not started = still valid (will start now)
    }

    const elapsed = Date.now() - new Date(user.trial_started_at).getTime()
    const daysUsed = elapsed / (1000 * 60 * 60 * 24)
    if (daysUsed >= 30) {
      return { valid: false, error: 'Trial expired' }
    }

    return { valid: true }
  } catch (err: any) {
    console.error('[proxy-stt] User validation error:', err.message)
    return { valid: false, error: 'Validation failed' }
  }
}
