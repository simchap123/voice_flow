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

const GENERATE_PROMPT = `You are an AI writing assistant. The user dictated instructions for content they want created.
Generate the content they described. Return ONLY the content — no explanations or meta-commentary.
Match the implied tone and formality.`

const CODE_CLEANUP_PROMPT = `Convert spoken programming instructions to code syntax.
- Spoken variable names → camelCase
- Spoken operators → symbols (equals → =, not equals → !=)
- Spoken keywords → code (function, const, if)
- Spoken punctuation → symbols (open paren → (, semicolon → ;)
- Infer language from context (default TypeScript)
- Return ONLY code, no explanations or markdown fences
- Natural language parts become comments`

export class OpenAICleanupProvider implements CleanupProvider {
  name = 'OpenAI GPT-4o-mini'
  type = 'openai' as const
  private client: OpenAI | null = null

  init(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    })
  }

  async cleanup(rawText: string): Promise<string> {
    if (!this.client) throw new Error('OpenAI not configured.')
    if (!rawText.trim()) return rawText

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await this.client.chat.completions.create(
        {
          model: 'gpt-4o-mini',
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

  async generate(instructions: string): Promise<string> {
    if (!this.client) throw new Error('OpenAI not configured.')
    if (!instructions.trim()) return instructions

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await this.client.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 4096,
          messages: [
            { role: 'system', content: GENERATE_PROMPT },
            { role: 'user', content: instructions },
          ],
        },
        { signal: controller.signal }
      )
      return response.choices[0]?.message?.content?.trim() ?? instructions
    } finally {
      clearTimeout(timeout)
    }
  }

  async cleanupCode(rawText: string): Promise<string> {
    if (!this.client) throw new Error('OpenAI not configured.')
    if (!rawText.trim()) return rawText

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await this.client.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          temperature: 0.2,
          max_tokens: 2048,
          messages: [
            { role: 'system', content: CODE_CLEANUP_PROMPT },
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
