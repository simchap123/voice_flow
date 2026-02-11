import type { CleanupProvider, GenerationMode, OutputLength } from './types'

const API_BASE = 'https://freevoiceflow.vercel.app'

export class ManagedCleanupProvider implements CleanupProvider {
  name = 'VoxGen Cloud'
  type = 'managed' as const
  private email: string | null = null

  init(email: string) {
    this.email = email
  }

  private async proxyRequest(action: string, text: string, extras?: Record<string, string>): Promise<string> {
    if (!this.email) {
      throw new Error('Enter your email in Settings to use VoxGen during your free trial.')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(`${API_BASE}/api/proxy-cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          action,
          text,
          ...extras,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Proxy cleanup failed (${response.status})`)
      }

      const data = await response.json()
      return data.text
    } finally {
      clearTimeout(timeout)
    }
  }

  async cleanup(rawText: string): Promise<string> {
    if (!rawText.trim()) return rawText
    return this.proxyRequest('cleanup', rawText)
  }

  async generate(instructions: string): Promise<string> {
    if (!instructions.trim()) return instructions
    return this.proxyRequest('generate', instructions)
  }

  async cleanupCode(rawText: string): Promise<string> {
    if (!rawText.trim()) return rawText
    return this.proxyRequest('cleanupCode', rawText)
  }

  async generateWithTemplate(mode: GenerationMode, instructions: string, outputLength: OutputLength): Promise<string> {
    if (!instructions.trim()) return instructions
    return this.proxyRequest('generateWithTemplate', instructions, { mode, outputLength })
  }

  async refinePrompt(rawInstructions: string): Promise<string> {
    if (!rawInstructions.trim()) return rawInstructions
    return this.proxyRequest('refinePrompt', rawInstructions)
  }

  isAvailable(): boolean {
    return this.email !== null
  }
}
