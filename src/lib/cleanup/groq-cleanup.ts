import OpenAI from 'openai'
import type { CleanupProvider, GenerationMode, OutputLength } from './types'
import { getGenerationPrompt, getMaxTokensForLength, getRefinementPrompt } from './generation-templates'

const CLEANUP_PROMPT = `You are a transcription cleanup assistant. Your ONLY job is to clean up speech-to-text output. Rules:
- Remove filler words (um, uh, like, you know, so, basically, actually, I mean)
- Fix grammar and punctuation
- Resolve self-corrections: if the speaker changes their mind (e.g. "1 o'clock, no wait, 5 o'clock"), keep ONLY the final decision ("5 o'clock")
- Preserve the speaker's intended meaning — use common sense to understand what they actually want to say
- Do NOT add markdown formatting, asterisks, stars, headings, or bullet points — return plain text only
- Keep the same tone and register (formal/informal)
- If the text is already clean, return it unchanged
- Return ONLY the cleaned text as plain text, nothing else`

const GENERATE_PROMPT = `You are an AI writing assistant. The user dictated instructions for content they want created.
Generate the content they described. Return ONLY the content — no explanations or meta-commentary.
Match the implied tone and formality.`

const CODE_CLEANUP_PROMPT = `You are an expert programmer. Convert spoken programming instructions into clean, working code.
- Infer the programming language from context (default TypeScript)
- Include necessary imports and type annotations
- Generate complete, runnable code — not just syntax conversion
- Follow best practices and idiomatic patterns for the target language
- Add brief comments only for non-obvious logic
- If the user describes a function, class, or component, generate the full implementation
- If the user describes simple expressions or variable declarations, keep it concise
- Return ONLY the code — no markdown fences, no explanations outside of code comments`

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

  async generate(instructions: string): Promise<string> {
    if (!this.client) throw new Error('Groq not configured.')
    if (!instructions.trim()) return instructions

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await this.client.chat.completions.create(
        {
          model: 'llama-3.3-70b-versatile',
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
    if (!this.client) throw new Error('Groq not configured.')
    if (!rawText.trim()) return rawText

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await this.client.chat.completions.create(
        {
          model: 'llama-3.3-70b-versatile',
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

  async generateWithTemplate(mode: GenerationMode, instructions: string, outputLength: OutputLength): Promise<string> {
    if (!this.client) throw new Error('Groq not configured.')
    if (!instructions.trim()) return instructions

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await this.client.chat.completions.create(
        {
          model: 'llama-3.3-70b-versatile',
          temperature: mode === 'code' ? 0.3 : 0.7,
          max_tokens: getMaxTokensForLength(outputLength),
          messages: [
            { role: 'system', content: getGenerationPrompt(mode, outputLength) },
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

  async refinePrompt(rawInstructions: string): Promise<string> {
    if (!this.client) throw new Error('Groq not configured.')
    if (!rawInstructions.trim()) return rawInstructions

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await this.client.chat.completions.create(
        {
          model: 'llama-3.3-70b-versatile',
          temperature: 0.4,
          max_tokens: 512,
          messages: [
            { role: 'system', content: getRefinementPrompt() },
            { role: 'user', content: rawInstructions },
          ],
        },
        { signal: controller.signal }
      )
      return response.choices[0]?.message?.content?.trim() ?? rawInstructions
    } finally {
      clearTimeout(timeout)
    }
  }

  isAvailable(): boolean {
    return this.client !== null
  }
}
