import type { STTProvider } from './types'

const API_BASE = 'https://voxgenflow.vercel.app'

export class ManagedSTTProvider implements STTProvider {
  name = 'VoxGen Cloud'
  type = 'managed' as const
  private email: string | null = null

  init(email: string) {
    this.email = email
  }

  async transcribe(audio: Blob, language: string): Promise<string> {
    if (!this.email) {
      throw new Error('Enter your email in Settings to use VoxGen during your free trial.')
    }

    // Convert audio blob to base64
    const arrayBuffer = await audio.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i])
    }
    const base64Audio = btoa(binary)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(`${API_BASE}/api/proxy-stt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          audio: base64Audio,
          language,
          mimeType: audio.type || 'audio/webm',
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Proxy STT failed (${response.status})`)
      }

      const data = await response.json()
      return data.text
    } finally {
      clearTimeout(timeout)
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.email !== null
  }
}
