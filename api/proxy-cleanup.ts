import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { validateUser } from './lib/validate-user'

const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim()
const MODEL = 'llama-3.3-70b-versatile'

// Max text input: 50KB
const MAX_TEXT_SIZE = 50 * 1024

const PROMPTS: Record<string, string> = {
  cleanup: `You are a transcription cleanup assistant. Your ONLY job is to clean up speech-to-text output. Rules:
- Remove filler words (um, uh, like, you know, so, basically, actually, I mean)
- Fix grammar and punctuation
- Preserve the speaker's original meaning exactly
- Do NOT add, change, or rephrase content
- Do NOT add formatting, headings, or bullet points unless the speaker clearly intended them
- Keep the same tone and register (formal/informal)
- If the text is already clean, return it unchanged
- Return ONLY the cleaned text, nothing else`,

  generate: `You are an AI writing assistant. The user dictated instructions for content they want created.
Generate the content they described. Return ONLY the content — no explanations or meta-commentary.
Match the implied tone and formality.`,

  cleanupCode: `You are an expert programmer. Convert spoken programming instructions into clean, working code.
- Infer the programming language from context (default TypeScript)
- Include necessary imports and type annotations
- Generate complete, runnable code — not just syntax conversion
- Follow best practices and idiomatic patterns for the target language
- Add brief comments only for non-obvious logic
- If the user describes a function, class, or component, generate the full implementation
- If the user describes simple expressions or variable declarations, keep it concise
- Return ONLY the code — no markdown fences, no explanations outside of code comments`,

  refinePrompt: `You are a prompt refinement assistant. The user dictated rough instructions for content they want generated.
Your job is to improve and clarify their instructions before they're sent to a content generator.
- Fix grammar and remove filler words
- Clarify ambiguous parts
- Add structure (e.g. specify tone, audience, key points)
- Keep the user's original intent intact
- Return ONLY the refined instructions, nothing else`,
}

const ACTION_CONFIGS: Record<string, { temperature: number; maxTokens: number }> = {
  cleanup: { temperature: 0.3, maxTokens: 2048 },
  generate: { temperature: 0.7, maxTokens: 4096 },
  cleanupCode: { temperature: 0.2, maxTokens: 2048 },
  refinePrompt: { temperature: 0.4, maxTokens: 512 },
  generateWithTemplate: { temperature: 0.7, maxTokens: 4096 },
}

const MODE_PROMPTS: Record<string, string> = {
  email: `You are a professional email writer. Write the email body based on the user's instructions.
- Use appropriate greeting and sign-off
- Match the formality level implied by the instructions
- Return ONLY the email text`,
  code: `You are an expert programmer. Generate clean, working code based on the user's description.
- Infer the programming language from context (default TypeScript)
- Include necessary imports
- Return ONLY the code — no markdown fences`,
  summary: `You are a concise summarizer. Create a clear, well-organized summary.
- Extract and present the key points
- Use bullet points for multiple items when appropriate
- Return ONLY the summary text`,
  expand: `You are a writing assistant who elaborates on ideas. Develop the content into fuller, more detailed prose.
- Add context, examples, and supporting arguments
- Maintain the original tone and intent
- Return ONLY the expanded text`,
  general: `You are an AI writing assistant. Generate the content the user described.
- Match the implied tone and formality
- Return ONLY the generated content`,
}

const LENGTH_INSTRUCTIONS: Record<string, { instruction: string; maxTokens: number }> = {
  concise: { instruction: 'Be brief and to the point.', maxTokens: 1024 },
  medium: { instruction: 'Cover key points clearly without being verbose.', maxTokens: 2048 },
  detailed: { instruction: 'Be thorough. Include examples and context.', maxTokens: 4096 },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!GROQ_API_KEY) {
    console.error('[proxy-cleanup] GROQ_API_KEY not configured')
    return res.status(500).json({ error: 'Proxy not configured' })
  }

  const { email, action, text, mode, outputLength } = req.body as {
    email?: string
    action?: string
    text?: string
    mode?: string
    outputLength?: string
  }

  if (!email || !action || !text) {
    return res.status(400).json({ error: 'Missing email, action, or text' })
  }

  // Reject oversized text input
  if (text.length > MAX_TEXT_SIZE) {
    return res.status(400).json({ error: 'Text too large (max 50KB)' })
  }

  // Validate user
  const validation = await validateUser(email.trim().toLowerCase(), 'proxy-cleanup')
  if (!validation.valid) {
    return res.status(403).json({ error: validation.error || 'Access denied' })
  }

  try {
    const client = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    let systemPrompt: string
    let temperature: number
    let maxTokens: number

    if (action === 'generateWithTemplate') {
      const modePrompt = MODE_PROMPTS[mode || 'general'] || MODE_PROMPTS.general
      const lengthInfo = LENGTH_INSTRUCTIONS[outputLength || 'medium'] || LENGTH_INSTRUCTIONS.medium
      systemPrompt = `${modePrompt}\n\nLength guideline: ${lengthInfo.instruction}`
      temperature = (mode === 'code') ? 0.3 : 0.7
      maxTokens = lengthInfo.maxTokens
    } else {
      systemPrompt = PROMPTS[action]
      if (!systemPrompt) {
        return res.status(400).json({ error: `Unknown action: ${action}` })
      }
      const config = ACTION_CONFIGS[action]
      temperature = config.temperature
      maxTokens = config.maxTokens
    }

    const response = await client.chat.completions.create({
      model: MODEL,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
    })

    const result = response.choices[0]?.message?.content?.trim() ?? text
    return res.status(200).json({ text: result })
  } catch (err: any) {
    console.error('[proxy-cleanup] Error:', err.message)
    return res.status(500).json({ error: 'Processing failed' })
  }
}
