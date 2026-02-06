import type { Snippet } from '@/types/snippets'

export function expandSnippets(text: string, snippets: Snippet[]): string {
  if (!snippets.length) return text

  let result = text
  for (const snippet of snippets) {
    // Case-insensitive replacement of trigger words
    const regex = new RegExp(`\\b${escapeRegex(snippet.trigger)}\\b`, 'gi')
    result = result.replace(regex, snippet.expansion)
  }
  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
