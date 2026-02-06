import OpenAI from 'openai'

let client: OpenAI | null = null

export function initOpenAI(apiKey: string) {
  client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

export function getOpenAIClient(): OpenAI | null {
  return client
}

export async function transcribeAudio(
  audioBlob: Blob,
  language: string = 'en'
): Promise<string> {
  if (!client) throw new Error('OpenAI client not initialized. Set your API key in Settings.')

  const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })

  const response = await client.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: language === 'auto' ? undefined : language,
  })

  return response.text
}

export async function cleanupTranscription(rawText: string): Promise<string> {
  if (!client) throw new Error('OpenAI client not initialized. Set your API key in Settings.')
  if (!rawText.trim()) return rawText

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content: `You are a transcription cleanup assistant. Your ONLY job is to clean up speech-to-text output. Rules:
- Remove filler words (um, uh, like, you know, so, basically, actually, I mean)
- Fix grammar and punctuation
- Preserve the speaker's original meaning exactly
- Do NOT add, change, or rephrase content
- Do NOT add formatting, headings, or bullet points unless the speaker clearly intended them
- Keep the same tone and register (formal/informal)
- If the text is already clean, return it unchanged
- Return ONLY the cleaned text, nothing else`,
      },
      {
        role: 'user',
        content: rawText,
      },
    ],
  })

  return response.choices[0]?.message?.content?.trim() ?? rawText
}
