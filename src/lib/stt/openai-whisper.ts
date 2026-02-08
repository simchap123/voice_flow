import OpenAI from 'openai'
import type { STTProvider } from './types'

export class OpenAIWhisperProvider implements STTProvider {
  name = 'OpenAI Whisper'
  type = 'openai' as const
  private client: OpenAI | null = null

  init(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    })
  }

  async transcribe(audio: Blob, language: string): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI not configured. Add your API key in Settings.')
    }

    const file = new File([audio], 'recording.webm', { type: 'audio/webm' })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await this.client.audio.transcriptions.create(
        {
          model: 'whisper-1',
          file,
          language: language === 'auto' ? undefined : language,
        },
        { signal: controller.signal }
      )
      return response.text
    } finally {
      clearTimeout(timeout)
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.client !== null
  }
}
