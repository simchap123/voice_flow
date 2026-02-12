export interface ChangelogEntry {
  version: string
  date: string
  highlights: string[]
}

// Most recent first
export const changelog: ChangelogEntry[] = [
  {
    version: '2.0.9',
    date: '2026-02-12',
    highlights: [
      'Balanced cleanup prompt: keeps your exact words while resolving self-corrections ("meet at 9, no 4" → "meet at 4")',
      'Words like "please", "just", "really" are no longer stripped',
      'Added What\'s New page',
    ],
  },
  {
    version: '2.0.8',
    date: '2026-02-12',
    highlights: [
      'Stricter verbatim dictation — cleanup no longer rephrases your words',
      'Temperature lowered to 0.1 for more literal transcription',
    ],
  },
  {
    version: '2.0.7',
    date: '2026-02-12',
    highlights: [
      'Silent one-click updates — no more installer wizard',
      'Signed-in email shown in sidebar',
      'Auto-detect updates in About section',
    ],
  },
  {
    version: '2.0.6',
    date: '2026-02-12',
    highlights: [
      'Fixed snippets not syncing to overlay window',
      'Removed overly broad keyword trigger that intercepted normal dictation',
    ],
  },
  {
    version: '2.0.5',
    date: '2026-02-12',
    highlights: [
      'Added microphone selector in Settings',
    ],
  },
  {
    version: '2.0.4',
    date: '2026-02-12',
    highlights: [
      'Fixed free trial managed mode (stale closure bug)',
      'Added first-run onboarding experience',
      'Overlay follows mouse across monitors',
      'Overlay stays on top of all windows',
    ],
  },
]
