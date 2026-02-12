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

  return noDetection
}
