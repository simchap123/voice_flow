export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
