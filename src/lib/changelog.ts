export interface ChangelogEntry {
  version: string
  date: string
  highlights: string[]
}

// Most recent first
export const changelog: ChangelogEntry[] = [
  {
    version: '2.1.2',
    date: '2026-02-12',
    highlights: [
      'Reverted to the original v1.0 cleanup prompt — simple, proven, and effective',
      'Temperature back to 0.3 (was over-tuned at 0.1)',
      'Usage stats banner in Account tab (words dictated, minutes recorded)',
    ],
  },
  {
    version: '2.1.1',
    date: '2026-02-12',
    highlights: [
      'Cleanup no longer removes "OK", "okay", "like", "you know" — only true filler sounds (um, uh, er, ah, hmm)',
      'Incomplete thoughts and trail-offs are preserved as spoken',
      'Self-corrections only resolved when you explicitly correct yourself ("no", "wait", "never mind")',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-02-12',
    highlights: [
      'Keyword triggers now work — say "write me an email about..." during dictation to generate content',
      'Output length (Concise/Medium/Detailed) now controls generated content length',
      'Prompt refinement cleans up spoken instructions before generation',
      'Smart preamble handling — "OK perfect write me an email about..." is detected correctly',
      'Updates auto-install silently when you\'re not recording',
    ],
  },
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
