/**
 * Pre-AI text formatter — breaks wall-of-text transcriptions into
 * readable paragraphs before AI cleanup.
 *
 * Runs as Stage 3 of the cleanup pipeline (optional, on by default).
 * Only activates for text longer than 100 words.
 */

const TARGET_WORDS_PER_PARAGRAPH = 50
const MAX_SENTENCES_PER_PARAGRAPH = 4
const MIN_WORDS_FOR_FORMATTING = 100

// Common abbreviations that end with a period but aren't sentence endings
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'ave', 'blvd',
  'vs', 'etc', 'inc', 'ltd', 'corp', 'dept', 'est', 'approx',
  'e.g', 'i.e', 'a.m', 'p.m', 'u.s', 'u.k',
])

/**
 * Split text into sentences, respecting abbreviations and decimals.
 */
function splitSentences(text: string): string[] {
  const sentences: string[] = []
  let current = ''

  const words = text.split(/\s+/)

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    current += (current ? ' ' : '') + word

    // Check if word ends with sentence-ending punctuation
    if (/[.!?]$/.test(word)) {
      // Strip the punctuation to check if it's an abbreviation
      const bare = word.replace(/[.!?]+$/, '').toLowerCase()

      // Don't split on abbreviations
      if (ABBREVIATIONS.has(bare)) continue

      // Don't split on single-letter initials (e.g., "J. K. Rowling")
      if (bare.length === 1 && word.endsWith('.')) continue

      // Don't split on decimals (e.g., "3.5", "$20.00")
      if (/\d\.\d/.test(word)) continue

      // This is a real sentence boundary
      sentences.push(current.trim())
      current = ''
    }
  }

  // Push any remaining text as the last sentence
  if (current.trim()) {
    sentences.push(current.trim())
  }

  return sentences.filter(s => s.length > 0)
}

/**
 * Count words in a string (simple whitespace split).
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/**
 * Break long transcriptions into paragraphs.
 * Short text (< 100 words) is returned unchanged.
 */
export function formatParagraphs(text: string): string {
  if (!text.trim()) return text

  const totalWords = countWords(text)
  if (totalWords < MIN_WORDS_FOR_FORMATTING) return text

  // Split into sentences
  const sentences = splitSentences(text)
  if (sentences.length <= MAX_SENTENCES_PER_PARAGRAPH) return text

  const paragraphs: string[] = []
  let currentChunk: string[] = []
  let currentWordCount = 0

  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence)
    currentChunk.push(sentence.trim())
    currentWordCount += sentenceWords

    // Break into a new paragraph when we hit the target
    const shouldBreak =
      currentWordCount >= TARGET_WORDS_PER_PARAGRAPH ||
      currentChunk.length >= MAX_SENTENCES_PER_PARAGRAPH

    if (shouldBreak) {
      paragraphs.push(currentChunk.join(' '))
      currentChunk = []
      currentWordCount = 0
    }
  }

  // Don't leave a tiny orphan paragraph — merge with previous
  if (currentChunk.length > 0) {
    const orphan = currentChunk.join(' ')
    if (paragraphs.length > 0 && countWords(orphan) < 20) {
      paragraphs[paragraphs.length - 1] += ' ' + orphan
    } else {
      paragraphs.push(orphan)
    }
  }

  return paragraphs.join('\n\n')
}
