import OpenAI from 'openai'
import type { CleanupProvider } from './types'

const CLEANUP_PROMPT = `You are a transcription cleanup assistant. Your ONLY job is to clean up speech-to-text output. Rules:
- Remove filler words (um, uh, like, you know, so, basically, actually, I mean)
- Fix grammar and punctuation
- Preserve the speaker's original meaning exactly
- Do NOT add, change, or rephrase content
- Do NOT add formatting, headings, or bullet points unless the speaker clearly intended them
- Keep the same tone and register (formal/informal)
- If the text is already clean, return it unchanged
- Return ONLY the cleaned text, nothing else`

export class GroqCleanupProvider implements CleanupProvider {
  name = 'Groq Llama'
  type = 'groq' as const
  private client: OpenAI | null = null

  init(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      dangerouslyAllowBrowser: true,
    })
  }

  async cleanup(rawText: string): Promise<string> {
    if (!this.client) throw new Error('Groq not configured.')
    if (!rawText.trim()) return rawText

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await this.client.chat.completions.create(
        {
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_tokens: 2048,
          messages: [
            { role: 'system', content: CLEANUP_PROMPT },
            { role: 'user', content: rawText },
          ],
        },
        { signal: controller.signal }
      )
      return response.choices[0]?.message?.content?.trim() ?? rawText
    } finally {
      clearTimeout(timeout)
    }
  }

  isAvailable(): boolean {
    return this.client !== null
  }
}
