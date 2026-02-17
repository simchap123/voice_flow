import { net } from 'electron'
import { getSetting, getDeviceId } from './store'

const API_BASE = 'https://voxgenflow.vercel.app'

export async function trackUsage(data: {
  wordCount?: number
  duration?: number
  language?: string
}): Promise<void> {
  const email = getSetting('userEmail')
  if (!email) return // No user email — skip tracking

  const sttProvider = getSetting('sttProvider')
  const cleanupProvider = getSetting('cleanupProvider')

  const body = JSON.stringify({
    email,
    deviceId: getDeviceId(),
    words: data.wordCount ?? 0,
    audioSeconds: data.duration ?? 0,
    sttProvider: sttProvider ?? 'unknown',
    cleanupProvider: cleanupProvider ?? 'none',
    language: data.language ?? 'en',
  })

  return new Promise((resolve, reject) => {
    const request = net.request({
      url: `${API_BASE}/api/track-usage`,
      method: 'POST',
    })

    request.setHeader('Content-Type', 'application/json')

    request.on('response', (response) => {
      // Drain the response
      response.on('data', () => {})
      response.on('end', () => resolve())
    })

    request.on('error', (err) => {
      console.error('[VoxGen] Usage tracking failed:', err.message)
      reject(err)
    })

    request.write(body)
    request.end()
  })
}
