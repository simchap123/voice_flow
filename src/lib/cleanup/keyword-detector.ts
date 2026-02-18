import type { GenerationMode } from './types'

export interface KeywordDetection {
  detected: boolean
  triggerType: GenerationMode | null
  contentAfterTrigger: string
  triggerPhrase: string
}

interface TriggerPattern {
  mode: GenerationMode
  patterns: RegExp[]
}

// Common preamble words STT captures before the actual command.
// We strip these iteratively (up to 3 rounds) before checking triggers.
const PREAMBLE_RE = /^(?:ok(?:ay)?|perfect|alright|all\s*right|so|hey|hi|um+|uh+|well|right|yeah|yes|sure|now|let's\s+see|let\s+me\s+see|I\s+want\s+you\s+to|I\s+need\s+you\s+to|can\s+you(?:\s+please)?|please)\s*[,.]?\s*/i

function stripPreamble(text: string): string {
  let stripped = text.trim()
  for (let i = 0; i < 3; i++) {
    const before = stripped
    stripped = stripped.replace(PREAMBLE_RE, '')
    if (stripped === before) break
  }
  return stripped
}

// Priority-ordered: email > code > summary > expand
// Patterns match at the START of text (after preamble stripping).
// NOTE: No "general" catch-all — too many false positives on normal speech.
// For open-ended generation, users should use the dedicated AI Prompt hotkey.
const TRIGGER_PATTERNS: TriggerPattern[] = [
  {
    mode: 'email',
    patterns: [
      /^(?:write|draft|compose|send)\s+(?:me\s+)?(?:an?\s+)?email\s+(?:about|regarding|for|to|saying|that)\s+(.+)/i,
      /^email\s+(?:about|regarding|for)\s+(.+)/i,
      /^(?:write|draft|compose|send)\s+(?:me\s+)?(?:an?\s+)?email\s*[,:.]?\s+(.+)/i,
    ],
  },
  {
    mode: 'code',
    patterns: [
      /^(?:write|create|make|build)\s+(?:me\s+)?(?:a\s+)?(?:function|class|component|module|script|program)\s+(?:that|which|to|for)\s+(.+)/i,
      /^code\s+(?:that|which|to|for|a)\s+(.+)/i,
      /^(?:write|create|make|build)\s+(?:me\s+)?(?:some\s+)?code\s+(?:that|which|to|for)\s+(.+)/i,
      /^(?:write|create|make)\s+(?:me\s+)?(?:a\s+)?(?:typescript|javascript|python|react|html|css)\s+(.+)/i,
    ],
  },
  {
    mode: 'summary',
    patterns: [
      /^summarize\s+(.+)/i,
      /^(?:give\s+me\s+)?(?:a\s+)?summary\s+(?:of\s+)?(.+)/i,
      /^tldr\s+(.+)/i,
      /^(?:give\s+me\s+)?(?:a\s+)?(?:brief|quick)\s+(?:summary|overview)\s+(?:of\s+)?(.+)/i,
    ],
  },
  {
    mode: 'expand',
    patterns: [
      /^expand\s+(?:on\s+)?(.+)/i,
      /^elaborate\s+(?:on\s+)?(.+)/i,
      /^(?:go\s+)?(?:more\s+)?(?:in|into)\s+(?:detail|depth)\s+(?:about|on)\s+(.+)/i,
    ],
  },
]

// Trailing trigger phrases — matched at the END of text.
// Sorted longest-first at runtime for most-specific matching.
const TRAILING_TRIGGERS: { mode: GenerationMode; phrases: string[] }[] = [
  {
    mode: 'email',
    phrases: ['email mode', 'as an email', 'make it an email', 'format as email', 'send as email'],
  },
  {
    mode: 'code',
    phrases: ['code mode', 'as code', 'make it code', 'format as code'],
  },
  {
    mode: 'summary',
    phrases: ['summary mode', 'summarize that', 'make it a summary'],
  },
  {
    mode: 'expand',
    phrases: ['expand mode', 'expand on that', 'elaborate on that'],
  },
]

/**
 * Check if text ends with a trailing trigger phrase.
 * Returns the mode + remaining text with trigger stripped, or null.
 */
function detectTrailingTrigger(text: string): { mode: GenerationMode; content: string; phrase: string } | null {
  const trimmed = text.trim()
  // Remove trailing punctuation for matching
  const cleaned = trimmed.replace(/[,.!?;:]+$/, '').trim()
  const lower = cleaned.toLowerCase()

  // Flatten and sort by length (longest first) for most-specific matching
  const allTrailing = TRAILING_TRIGGERS.flatMap(t =>
    t.phrases.map(p => ({ mode: t.mode, phrase: p }))
  ).sort((a, b) => b.phrase.length - a.phrase.length)

  for (const { mode, phrase } of allTrailing) {
    if (lower.endsWith(phrase)) {
      // Check word boundary before the trigger phrase
      const beforeIndex = cleaned.length - phrase.length
      if (beforeIndex > 0) {
        const charBefore = cleaned[beforeIndex - 1]
        if (/[a-zA-Z0-9]/.test(charBefore)) continue // Not a word boundary
      }

      let content = cleaned.slice(0, beforeIndex).trim()
      // Clean up trailing punctuation/separators
      content = content.replace(/[,.!?;:\s]+$/, '').trim()

      if (!content) continue // No content before trigger

      // Capitalize first letter
      if (content.length > 0) {
        content = content.charAt(0).toUpperCase() + content.slice(1)
      }

      return { mode, content, phrase }
    }
  }

  return null
}

export function detectKeywordTrigger(rawText: string, enabled: boolean): KeywordDetection {
  const noDetection: KeywordDetection = {
    detected: false,
    triggerType: null,
    contentAfterTrigger: '',
    triggerPhrase: '',
  }

  if (!enabled || !rawText.trim()) return noDetection

  // Strip common preamble so "OK perfect write me an email about X" works
  const text = stripPreamble(rawText)
  if (!text) return noDetection

  // 1. Check START-of-text triggers first (original behavior)
  for (const { mode, patterns } of TRIGGER_PATTERNS) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const contentAfterTrigger = match[1]?.trim() || ''
        // Only trigger if there's actual content after the trigger phrase
        if (!contentAfterTrigger) continue

        return {
          detected: true,
          triggerType: mode,
          contentAfterTrigger,
          triggerPhrase: text.slice(0, text.indexOf(contentAfterTrigger)).trim(),
        }
      }
    }
  }

  // 2. Check END-of-text triggers (new: "book a flight to NYC, email mode")
  const trailing = detectTrailingTrigger(text)
  if (trailing) {
    return {
      detected: true,
      triggerType: trailing.mode,
      contentAfterTrigger: trailing.content,
      triggerPhrase: trailing.phrase,
    }
  }

  return noDetection
}
