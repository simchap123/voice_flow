/**
 * Pre-AI transcript filter — removes Whisper hallucinations and artifacts
 * before text reaches the AI cleanup provider.
 *
 * Runs as Stage 1 of the cleanup pipeline (always active, even when cleanup is disabled).
 */

// Square brackets: always Whisper artifacts — [music], [laughter], [BLANK_AUDIO]
const SQUARE_BRACKET_PATTERN = /\[.*?\]/g

// Curly braces: always Whisper artifacts — {background noise}
const CURLY_BRACKET_PATTERN = /\{.*?\}/g

// Parentheses: only remove KNOWN hallucination phrases, not all parenthesized text
const PAREN_HALLUCINATIONS = /\(\s*(?:laughing|laughter|applause|music|inaudible|silence|background noise|coughing|sneezing|sighing|breathing|crosstalk|foreign language|phone ringing|bell|beep|buzzing|static)\s*\)/gi

// XML-style tag blocks hallucinated by some Whisper models
const XML_TAG_BLOCK = /<([A-Za-z][A-Za-z0-9:_-]*)[^>]*>[\s\S]*?<\/\1>/g

/**
 * Detect repeated Whisper hallucinations (e.g., "Thank you." repeated 10x)
 * using a safe iterative approach instead of backreference regex.
 */
function collapseRepeatedPhrases(text: string, minLength = 4, minRepeats = 3): string {
  // Split into sentences and look for consecutive identical ones
  const sentences = text.split(/(?<=[.!?])\s+/)
  if (sentences.length < minRepeats) return text

  const result: string[] = []
  let i = 0

  while (i < sentences.length) {
    const current = sentences[i].trim()
    if (current.length < minLength) {
      result.push(current)
      i++
      continue
    }

    // Count consecutive identical sentences
    let count = 1
    while (i + count < sentences.length && sentences[i + count].trim() === current) {
      count++
    }

    // Keep only one instance if repeated 3+ times
    result.push(current)
    i += count
  }

  return result.join(' ')
}

/**
 * Remove Whisper hallucinations and artifacts from raw transcript text.
 * This is a cheap regex pass that runs before any AI call.
 */
export function filterTranscript(text: string): string {
  let filtered = text

  // Remove XML tag blocks first (greedy, might span lines)
  filtered = filtered.replace(XML_TAG_BLOCK, '')

  // Remove bracketed hallucinations (square + curly = always artifacts)
  filtered = filtered.replace(SQUARE_BRACKET_PATTERN, '')
  filtered = filtered.replace(CURLY_BRACKET_PATTERN, '')

  // Remove only known hallucination phrases in parentheses
  filtered = filtered.replace(PAREN_HALLUCINATIONS, '')

  // Collapse repeated hallucinated phrases (safe iterative approach)
  filtered = collapseRepeatedPhrases(filtered)

  // Clean up extra whitespace left behind
  filtered = filtered.replace(/\s{2,}/g, ' ')
  filtered = filtered.trim()

  return filtered
}

/**
 * Remove common filler words from transcript.
 * Separate from filterTranscript() because this is user-togglable.
 */
const DEFAULT_FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'so', 'basically',
  'actually', 'I mean', 'right', 'yeah', 'well',
]

export function removeFillerWords(text: string, fillerWords: string[] = DEFAULT_FILLER_WORDS): string {
  let filtered = text

  for (const filler of fillerWords) {
    // Word-boundary match, case-insensitive, also removes trailing comma/period
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`\\b${escaped}\\b[,.]?\\s*`, 'gi')
    filtered = filtered.replace(pattern, '')
  }

  // Clean up extra whitespace
  filtered = filtered.replace(/\s{2,}/g, ' ')
  filtered = filtered.trim()

  // Capitalize first letter if we stripped a leading filler
  if (filtered.length > 0 && filtered[0] !== text.trimStart()[0]) {
    filtered = filtered.charAt(0).toUpperCase() + filtered.slice(1)
  }

  return filtered
}
