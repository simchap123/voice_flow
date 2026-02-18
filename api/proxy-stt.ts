import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { validateUser } from './lib/validate-user'

const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim()

// Max audio size: 10MB base64 (~7.5MB decoded)
const MAX_AUDIO_SIZE = 10 * 1024 * 1024

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

  // Reject oversized audio payloads
  if (audio.length > MAX_AUDIO_SIZE) {
    return res.status(400).json({ error: 'Audio too large (max 10MB)' })
  }

  // Validate user has active trial or license
  const validation = await validateUser(email.trim().toLowerCase(), 'proxy-stt')
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
