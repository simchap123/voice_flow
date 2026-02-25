/**
 * Post-AI output filter — strips reasoning/thinking tags and other
 * artifacts that some LLMs include in their responses.
 *
 * Runs as the final stage of the cleanup pipeline (always active).
 */

// Tags that reasoning models (DeepSeek, Claude, etc.) sometimes output
const THINKING_TAG_PATTERNS = [
  /<thinking>[\s\S]*?<\/thinking>/gi,
  /<think>[\s\S]*?<\/think>/gi,
  /<reasoning>[\s\S]*?<\/reasoning>/gi,
  /<reflection>[\s\S]*?<\/reflection>/gi,
  /<internal>[\s\S]*?<\/internal>/gi,
]

// Some models echo back the transcript tags we sent
const TRANSCRIPT_TAG_PATTERN = /<\/?transcript>/gi

// Some models wrap output in markdown code fences when they shouldn't
const UNWANTED_CODE_FENCE = /^```(?:\w*)\n([\s\S]*?)```$/

/**
 * Filter AI output to remove thinking tags and other model artifacts.
 */
export function filterOutput(text: string): string {
  let filtered = text

  // Strip thinking/reasoning tag blocks
  for (const pattern of THINKING_TAG_PATTERNS) {
    filtered = filtered.replace(pattern, '')
  }

  // Strip echoed transcript tags
  filtered = filtered.replace(TRANSCRIPT_TAG_PATTERN, '')

  // Strip wrapping markdown code fences (only if they wrap the entire output)
  const fenceMatch = filtered.trim().match(UNWANTED_CODE_FENCE)
  if (fenceMatch) {
    filtered = fenceMatch[1]
  }

  // Clean up whitespace
  filtered = filtered.replace(/\n{3,}/g, '\n\n')
  filtered = filtered.trim()

  return filtered
}
