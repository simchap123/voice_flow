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

// Priority-ordered: email > code > summary > expand > general
// Patterns match at the START of transcribed text only to prevent false positives
const TRIGGER_PATTERNS: TriggerPattern[] = [
  {
    mode: 'email',
    patterns: [
      /^(?:write|draft|compose)\s+(?:me\s+)?(?:an?\s+)?email\s+(?:about|regarding|for|to)\s+(.+)/i,
      /^email\s+(?:about|regarding|for)\s+(.+)/i,
      /^(?:write|draft|compose)\s+(?:me\s+)?(?:an?\s+)?email\s*[:.]\s*(.+)/i,
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
  {
    mode: 'general',
    patterns: [
      // Require explicit generation intent — must say "generate/compose/draft" (not "write/create/make" which are too common in normal speech)
      /^generate\s+(?:me\s+)?(?:a\s+|an\s+)?(.+)/i,
      /^(?:compose|draft)\s+(?:me\s+)?(?:a\s+|an\s+)?(.+)/i,
      /^(?:write|create|make)\s+(?:me\s+)(?:a\s+|an\s+)(.+)/i, // requires "me" — "write me a..." vs just "write a..."
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

  const text = rawText.trim()

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
