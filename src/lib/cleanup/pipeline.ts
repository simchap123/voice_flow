/**
 * Multi-stage cleanup pipeline — the heart of VoxGen v3.0.
 *
 * Pipeline stages (in order):
 * 1. Hallucination filter (always on) — remove Whisper artifacts
 * 2. Filler word removal (optional) — remove "um", "uh", "like", etc.
 * 3. Paragraph formatting (optional) — break long text into paragraphs
 * 4. Word replacements (optional) — user-defined text replacements
 * 5. Trigger word detection — detect keyword triggers at start/end of text
 * 6. AI enhancement — the actual LLM call with context injection
 * 7. Output filter (always on) — strip thinking tags from AI response
 *
 * Stages 1-4 and 7 run even when the AI cleanup provider is "none".
 */

import { filterTranscript, removeFillerWords } from './transcript-filter'
import { formatParagraphs } from './text-formatter'
import { filterOutput } from './output-filter'
import { detectKeywordTrigger, type KeywordDetection } from './keyword-detector'
import { buildCleanupPrompt, buildUserMessage, DEFAULT_CLEANUP_INSTRUCTIONS } from './system-prompts'
import { getCleanupProvider } from './provider-factory'
import { getGenerationPrompt, getMaxTokensForLength, getRefinementPrompt } from './generation-templates'
import type { CleanupProviderType, GenerationMode, OutputLength } from './types'

export interface PipelineOptions {
  // Provider settings
  cleanupProvider: CleanupProviderType
  cleanupEnabled: boolean

  // Feature toggles
  fillerWordRemoval?: boolean
  autoFormatParagraphs?: boolean
  keywordTriggersEnabled?: boolean
  promptRefinementEnabled?: boolean
  codeMode?: boolean

  // Generation settings
  outputLength?: OutputLength
  mode?: string // 'prompt' for AI Prompt hotkey mode

  // Word replacements
  wordReplacements?: Array<{ original: string; replacement: string; enabled: boolean }>

  // Context for AI (Phase 2 features — optional for now)
  context?: {
    clipboard?: string
    windowTitle?: string
    windowProcess?: string
    customVocabulary?: string[]
  }

  // Custom prompt override (Phase 3 — optional for now)
  customPromptInstructions?: string
  useSystemInstructions?: boolean
}

export interface PipelineResult {
  text: string
  rawText: string
  detectedMode: GenerationMode | null
  triggerPhrase: string
  stages: string[] // which stages actually ran (for debugging)
}

/**
 * Run the full cleanup pipeline on raw transcript text.
 */
export async function runCleanupPipeline(
  rawText: string,
  options: PipelineOptions
): Promise<PipelineResult> {
  const {
    cleanupProvider,
    cleanupEnabled,
    fillerWordRemoval = false,
    autoFormatParagraphs = true,
    keywordTriggersEnabled = true,
    promptRefinementEnabled = false,
    codeMode = false,
    outputLength = 'medium',
    mode,
    wordReplacements = [],
    context,
    customPromptInstructions,
    useSystemInstructions = true,
  } = options

  const stages: string[] = []
  let text = rawText

  if (!text.trim()) {
    return { text: '', rawText, detectedMode: null, triggerPhrase: '', stages }
  }

  // ── Stage 1: Hallucination filter (always on) ──
  text = filterTranscript(text)
  stages.push('hallucination-filter')

  // ── Stage 2: Filler word removal (optional) ──
  if (fillerWordRemoval) {
    text = removeFillerWords(text)
    stages.push('filler-removal')
  }

  // ── Stage 3: Paragraph formatting (optional) ──
  if (autoFormatParagraphs) {
    text = formatParagraphs(text)
    stages.push('paragraph-format')
  }

  // ── Stage 4: Word replacements (optional) ──
  if (wordReplacements.length > 0) {
    text = applyWordReplacements(text, wordReplacements)
    stages.push('word-replacements')
  }

  // ── Stage 5: Trigger word detection ──
  let trigger: KeywordDetection = {
    detected: false,
    triggerType: null,
    contentAfterTrigger: '',
    triggerPhrase: '',
  }

  if (keywordTriggersEnabled) {
    trigger = detectKeywordTrigger(text, true)
    if (trigger.detected) {
      stages.push('trigger-detected:' + trigger.triggerType)
    }
  }

  // ── Stage 6: AI Enhancement ──
  const provider = getCleanupProvider(cleanupProvider)

  if (mode === 'prompt' && text.trim()) {
    // AI Prompt hotkey mode — always generate content
    stages.push('ai-generate')

    if (codeMode) {
      let instructions = text
      if (promptRefinementEnabled) instructions = await provider.refinePrompt(instructions)
      text = await provider.generateWithTemplate('code', instructions, outputLength)
    } else if (trigger.detected && trigger.triggerType) {
      let instructions = trigger.contentAfterTrigger
      if (promptRefinementEnabled) instructions = await provider.refinePrompt(instructions)
      text = await provider.generateWithTemplate(trigger.triggerType, instructions, outputLength)
    } else {
      let instructions = text
      if (promptRefinementEnabled) instructions = await provider.refinePrompt(instructions)
      text = await provider.generateWithTemplate('general', instructions, outputLength)
    }
  } else if (trigger.detected && trigger.triggerType && text.trim()) {
    // Keyword trigger in dictation mode — generate content
    stages.push('ai-generate')
    let instructions = trigger.contentAfterTrigger
    if (promptRefinementEnabled) instructions = await provider.refinePrompt(instructions)
    text = await provider.generateWithTemplate(trigger.triggerType, instructions, outputLength)
  } else if (cleanupEnabled && cleanupProvider !== 'none' && text.trim()) {
    // Normal dictation cleanup with enhanced system prompt
    stages.push('ai-cleanup')

    const instructions = customPromptInstructions || DEFAULT_CLEANUP_INSTRUCTIONS

    if (useSystemInstructions && provider.cleanupWithPrompt) {
      // Use enhanced "don't answer, just clean" system prompt with context
      const systemPrompt = buildCleanupPrompt(instructions)
      const userMessage = buildUserMessage(text, context)
      text = await provider.cleanupWithPrompt(systemPrompt, userMessage)
      stages.push('enhanced-prompt')
    } else {
      // Fallback for providers without custom prompt support (e.g. managed)
      text = await provider.cleanup(text)
    }
  }

  // ── Stage 7: Output filter (always on) ──
  text = filterOutput(text)
  stages.push('output-filter')

  return {
    text,
    rawText,
    detectedMode: trigger.detected ? trigger.triggerType : (mode === 'prompt' ? 'general' : null),
    triggerPhrase: trigger.triggerPhrase,
    stages,
  }
}

/**
 * Apply user-defined word replacements to text.
 */
function applyWordReplacements(
  text: string,
  replacements: Array<{ original: string; replacement: string; enabled: boolean }>
): string {
  let result = text

  for (const { original, replacement, enabled } of replacements) {
    if (!enabled) continue

    // Support comma-separated variants: "color, colour" → "colour"
    const variants = original.split(',').map(v => v.trim()).filter(Boolean)

    for (const variant of variants) {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`\\b${escaped}\\b`, 'gi')
      result = result.replace(pattern, replacement)
    }
  }

  return result
}
