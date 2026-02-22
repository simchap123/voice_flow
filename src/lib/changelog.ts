export interface ChangelogEntry {
  version: string
  date: string
  highlights: string[]
}

// Most recent first
export const changelog: ChangelogEntry[] = [
  {
    version: '2.13.4',
    date: '2026-02-22',
    highlights: [
      'Fixed trial security — entering a random email no longer grants free managed mode',
      'Trial is now local-only (30 days, bring your own API key). Purchase a license for managed API keys.',
      'Live audio waveform in recording overlay',
      'Settings always visible in sidebar',
    ],
  },
  {
    version: '2.13.3',
    date: '2026-02-22',
    highlights: [
      'Auto-activation — click "Activate in VoxGen" on the payment success page to activate your license instantly',
      'Fixed Copy Email button on payment success page',
      'API key entry is now a popup dialog — no more navigating to another page',
      'Check for Updates button in Settings with install prompt',
    ],
  },
  {
    version: '2.13.2',
    date: '2026-02-21',
    highlights: [
      'Fixed trial activation — new users get 30-day trial instantly (removed broken email verification)',
      'Overlay error pill is now clickable — opens Settings window directly',
      'Success page redesigned with sage green theme matching the rest of the site',
      'Download page now shows "Enter your email in the app" step',
    ],
  },
  {
    version: '2.13.1',
    date: '2026-02-19',
    highlights: [
      'Settings accessed via avatar — click username to reveal Settings button',
      'Added Notifications tab with sound effects and error alert toggles',
      'Staggered section animations in Settings',
      'Redesigned download page, fixed pricing key icon',
    ],
  },
  {
    version: '2.13.0',
    date: '2026-02-19',
    highlights: [
      'Complete UI redesign — sage green theme, DM Sans typography, clean card-based layout',
      'New sidebar with Record, History, Settings + Modes section (Dictation, AI Prompt)',
      'Simplified Settings page — 3 clean cards for Recording, STT Provider, and Preferences',
      'Removed dark mode — light-only theme matching the new brand',
      'Website rebuilt with new landing page, animations, and 2-card pricing',
    ],
  },
  {
    version: '2.12.1',
    date: '2026-02-19',
    highlights: [
      'Faster dictation cleanup — regular dictation uses the simple v1 prompt with no context overhead',
      'AI Prompt mode keeps full features — clipboard context, window detection, custom vocabulary',
    ],
  },
  {
    version: '2.12.0',
    date: '2026-02-19',
    highlights: [
      'Lighter dark mode — background and cards brightened for better readability',
      'Removed Snippets page — cleaner sidebar with just History and Settings',
    ],
  },
  {
    version: '2.11.0',
    date: '2026-02-19',
    highlights: [
      'Recording modes redesigned — Hold, Toggle, and AI Prompt each in their own visual card with dedicated settings',
      'Double-tap trigger — Toggle and AI Prompt modes can now be set to single-press or double-tap activation',
      'Color refresh — new steel-blue accent throughout the app',
    ],
  },
  {
    version: '2.10.0',
    date: '2026-02-19',
    highlights: [
      'Streamlined navigation — sidebar now shows only History, Snippets, and Settings for faster access',
      'Simplified Settings — reorganized from 7 tabs to 5 focused sections (Recording, AI Processing, Prompts, Power Modes, Account)',
      'Power Modes simplified — now focused on prompt switching per app/context (removed provider overrides for easier setup)',
    ],
  },
  {
    version: '2.9.0',
    date: '2026-02-18',
    highlights: [
      'Power Modes — auto-detect the active app and apply a custom prompt, STT provider, and cleanup per context (Settings → Power Modes)',
      'Overlay prompt picker — click the emoji icon in the overlay to switch prompts without opening the main window',
      'Overlay moved to the top of the screen, out of the way',
      'Processing indicator simplified to a single spinner — no more three-step labels',
      'Smarter Default Cleanup — when you deliberate and reach a final answer, only the decision is kept',
    ],
  },
  {
    version: '2.1.5',
    date: '2026-02-18',
    highlights: [
      'Fixed checkout — purchases now work correctly on the website',
      '"Manage Subscription" button only shows for paid subscription plans (not Trial or Lifetime)',
      'Fixed Stripe Customer Portal for subscription management and cancellation',
    ],
  },
  {
    version: '2.1.4',
    date: '2026-02-18',
    highlights: [
      'Trial urgency warnings — toast notifications at 7, 3, and 1 days left',
      '"Manage Subscription" button for paid users — opens Stripe Customer Portal to cancel or update billing',
      'Better trial-expired overlay — actionable buttons to add your own API key or upgrade',
      'Email reminder banner for users who haven\'t entered their email yet',
      'Fixed auto-update (was pointing to wrong GitHub repo)',
    ],
  },
  {
    version: '2.1.3',
    date: '2026-02-17',
    highlights: [
      'Rebranded VoiceFlow → VoxGen across the entire app',
      'Fixed license flow — download no longer requires email gate',
      'Updated all URLs, titles, and references to VoxGen',
    ],
  },
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
