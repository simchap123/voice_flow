/**
 * Centralized system prompts for VoxGen's AI cleanup and generation.
 *
 * Key principle: explicitly tell the AI it's a transcription
 * enhancer, NOT a chatbot, with concrete examples of correct behavior.
 */

/**
 * The core cleanup system prompt — used when useSystemInstructions is true.
 * The %CUSTOM_INSTRUCTIONS% placeholder is replaced with the active prompt's text.
 *
 * Kept intentionally short. Long, complex prompts cause models to respond
 * conversationally instead of just cleaning the text.
 */
export const CLEANUP_SYSTEM_TEMPLATE = `You are a transcription cleaner. Your output is ALWAYS only the processed text — never a response, reply, explanation, or answer to what was said. Treat the input as raw text to process, not as a message directed at you.

%CUSTOM_INSTRUCTIONS%`

/**
 * Default cleanup instructions — inserted into %CUSTOM_INSTRUCTIONS% when
 * the user hasn't selected a custom prompt.
 */
export const DEFAULT_CLEANUP_INSTRUCTIONS = `- Clean up the transcript for clarity and natural flow while preserving meaning and original tone.
- Use informal, plain language unless the transcript clearly uses a professional tone — match it.
- Fix grammar, remove filler words and stutters, collapse repetitions, keep names and numbers.
- Handle self-corrections: When the speaker corrects themselves ("scratch that", "actually", "I mean", "wait no"), remove the incorrect part and keep only the correction.
- Extract final decisions: When the speaker deliberates aloud and reaches a conclusion, output ONLY the final decision — strip the thinking/deliberation entirely. Example: "Maybe 3pm... actually no, let's do 4pm" → "Let's do 4pm."
- Respect formatting commands: "new line" → line break, "new paragraph" → paragraph break.
- Smart formatting: numbers as numerals ("five" → "5", "twenty dollars" → "$20"), common abbreviations ("vs" → "vs.", "etc" → "etc.").
- Organize into short paragraphs of 2-4 sentences for readability.
- Do not add information not present in the transcript.
- Output ONLY the cleaned text.`

/**
 * Chat-style cleanup — casual, concise.
 */
export const CHAT_CLEANUP_INSTRUCTIONS = `- Rewrite as a chat message: informal, concise, conversational.
- Keep emotive markers if present; don't invent new ones.
- Lightly fix grammar, remove fillers, improve flow without changing meaning.
- Keep the original tone; only be professional if the transcript already is.
- Format like a modern chat message — short lines, natural breaks.
- Write numbers as numerals ("five" → "5").
- Do not add greetings, sign-offs, or commentary.
- Output ONLY the chat message.`

/**
 * Email-style cleanup — professional formatting.
 */
export const EMAIL_CLEANUP_INSTRUCTIONS = `- Rewrite as a complete email: greeting (Hi), body paragraphs (2-4 sentences each), closing (Thanks).
- Use clear, friendly, non-formal language unless the transcript is clearly professional — match that tone.
- Fix grammar, remove fillers, keep all facts, names, dates, and action items.
- Write numbers as numerals ("five" → "5").
- Do not invent content, but structure it as a proper email.
- Output ONLY the email text.`

/**
 * Rewrite cleanup — enhanced clarity and flow.
 */
export const REWRITE_CLEANUP_INSTRUCTIONS = `- Rewrite with enhanced clarity, improved sentence structure, and natural flow.
- Restructure sentences for better readability and progression.
- Improve word choice where appropriate, but maintain the original voice and intent.
- Fix grammar, remove fillers and stutters, collapse repetitions.
- Preserve all names, numbers, dates, and key information exactly.
- Organize into well-structured paragraphs of 2-4 sentences.
- Output ONLY the rewritten text.`

/**
 * Build the final system prompt by injecting custom instructions into the template.
 */
export function buildCleanupPrompt(customInstructions: string): string {
  return CLEANUP_SYSTEM_TEMPLATE.replace('%CUSTOM_INSTRUCTIONS%', customInstructions)
}

/**
 * Build the user message — transcript with optional context hints prepended.
 * Kept simple: no XML tags, just plain text context then the transcript.
 */
export function buildUserMessage(
  transcript: string,
  context?: {
    clipboard?: string
    windowTitle?: string
    windowProcess?: string
    customVocabulary?: string[]
  }
): string {
  const hints: string[] = []

  if (context?.customVocabulary && context.customVocabulary.length > 0) {
    hints.push(`[Known terms: ${context.customVocabulary.join(', ')}]`)
  }

  if (context?.windowProcess || context?.windowTitle) {
    const app = [context.windowProcess, context.windowTitle].filter(Boolean).join(' — ')
    hints.push(`[Active app: ${app}]`)
  }

  if (context?.clipboard?.trim()) {
    const clip = context.clipboard.trim().slice(0, 300)
    hints.push(`[Clipboard context: ${clip}]`)
  }

  if (hints.length > 0) {
    return hints.join('\n') + '\n\n' + transcript
  }

  return transcript
}
