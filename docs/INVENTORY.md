# VoxGen — Complete Product Inventory

**Version:** v2.12.1 | **Last Updated:** Feb 19, 2026

---

## Desktop App Features

### Recording Modes

| Mode | How It Works | Hotkey Setting | Trigger |
|------|-------------|----------------|---------|
| Hold-to-Record | Hold modifier key, release to stop + paste | `holdHotkey` (e.g., Alt) | Hold key |
| Toggle Recording | Press to start, press again to stop | `toggleHotkey` | Single-press or double-tap |
| AI Prompt Mode | Speak instructions, AI generates content | `promptHotkey` | Single-press or double-tap |

### Speech-to-Text Providers

| Provider | Cost | Speed | Notes |
|----------|------|-------|-------|
| Groq Whisper | ~$0.0007/min | Fastest | Default for managed mode |
| OpenAI Whisper | $0.006/min | Fast | Higher accuracy |
| Managed (VoxGen Cloud) | Included | Medium | Proxied via `/api/proxy-stt`, adds network hop |
| Local whisper.cpp | Free | Varies | PLANNED — UI exists, backend not implemented |

### AI Cleanup Providers

| Provider | Cost | Notes |
|----------|------|-------|
| Groq Llama 3.3 70B | ~$0.0006/req | Fast, default for managed |
| OpenAI GPT-4o-mini | ~$0.0003/req | Best quality |
| Managed (VoxGen Cloud) | Included | Proxied via `/api/proxy-cleanup` |
| None | Free | Disabled, raw Whisper output only |

### AI Enhancement Features

| Feature | Setting Key | Default | Description |
|---------|-------------|---------|-------------|
| Code Mode | `codeMode` | false | Convert speech to code syntax |
| Keyword Triggers | `keywordTriggersEnabled` | true | Auto-detect "write me an email about..." |
| Output Length | `outputLength` | 'medium' | Concise / Medium / Detailed |
| Prompt Refinement | `promptRefinementEnabled` | false | AI cleans up spoken instructions first |
| Filler Word Removal | `fillerWordRemoval` | false | Strip "um", "uh", "like" before AI |
| Clipboard Context | `useClipboardContext` | true | AI uses clipboard to fix names/terms (prompt mode only) |
| Active Window Context | `useWindowContext` | true | Detects active app (prompt mode + power modes) |
| Custom Vocabulary | `customVocabulary` | [] | Up to 200 proper nouns/jargon |
| Word Replacements | `wordReplacements` | [] | Auto-correct specific words |

### AI Prompts System

| Feature | Description |
|---------|-------------|
| 4 Predefined Prompts | Default Cleanup, Chat Message, Email, Rewrite (editable) |
| Custom Prompts | User-created AI instructions |
| Prompt Picker | Click overlay to switch active prompt |
| Power Modes | Auto-detect active app, apply custom prompt per context |

### History & Export

| Feature | Description |
|---------|-------------|
| Transcription History | Persistent searchable log of all dictations |
| Recording Backup | All recordings auto-saved as .webm in `userData/recordings/` |
| History Search | Live filtering by text content |
| History Export | Download all history as JSON |
| Recording Export | Download individual .webm files |
| Copy to Clipboard | One-click copy from history cards |

### UI & Windows

| Component | Description |
|-----------|-------------|
| Main Window | Frameless, custom titlebar, sidebar nav (History + Settings) |
| Overlay Window | Always-on-top transparent pill (idle/recording/processing/error) |
| System Tray | Purple mic icon, context menu (Show/Hide/Quit) |
| Close-to-Tray | App hides instead of quitting |
| Dark/Light Theme | Toggle in settings |

### Overlay States

| State | Size | Shows |
|-------|------|-------|
| Idle | 380x48 | Waveform indicator, click to open prompt picker |
| Recording | 180x48 | Pulsing mic + duration + Stop/Cancel buttons |
| Processing | Compact | Spinner pill |
| Error | Compact | Error message, auto-hides after 4s |
| Trial Expired | Compact | Upgrade prompt |

### Licensing & Account

| Feature | Description |
|---------|-------------|
| Email-Based Activation | No license keys, enter purchase email |
| 30-Day Free Trial | Server-side tracking, tied to email + deviceId |
| Encrypted API Keys | Electron safeStorage (DPAPI on Windows) |
| Customer Portal | Stripe billing management (Pro only) |
| Usage Stats | Total words dictated + minutes recorded |
| Trial Urgency Warnings | Toast notifications at 7, 3, 1 days left |

### Auto-Update

| Feature | Description |
|---------|-------------|
| GitHub Releases | Auto-checks on startup, downloads in background |
| Manual Check | "Check for Updates" button in Settings |
| Prompt to Restart | After download completes |

### Onboarding

| Step | Description |
|------|-------------|
| 1. Welcome | Introduction screen |
| 2. Activate Trial | Enter email, validates via API |
| 3. How to Use | Quick-start instructions |

---

## Website Pages

### 1. index.html (Homepage)

**Hero Section:**
- Tagline: "Your voice, perfected."
- Subtitle: "Press a hotkey from any app, speak naturally, and your cleaned-up text appears right where your cursor is."
- CTA: "Get Started Free"
- Badge: "Now available for Windows"
- Trial note: "Free 30-day trial. No credit card required."

**How It Works (3 steps):**
1. Download & Install (30 seconds)
2. Press Your Hotkey (from any app)
3. Text Appears (cleaned up, pasted automatically)

**Features (6 cards):**
1. Works Everywhere
2. AI Text Cleanup
3. Lightning Fast
4. Private & Secure
5. 99+ Languages
6. Voice Commands (AI content generation from spoken instructions)

**Pricing (3 plans):**
- See Pricing section below

**Get Started:**
- Email input (optional)
- CTAs: "Download Free" + "Go Pro"
- "Windows 10/11 • 64-bit • 30-day free trial"

**Navigation:**
- Features | How It Works | Pricing | What's New | Download

### 2. download.html

- Email gate → download instructions
- 3-step setup guide with SmartScreen warning

### 3. whats-new.html (Changelog)

- Version history from v2.12.1 back to v2.0.4
- "Latest" badge on newest version

### 4. walkthrough.html (How It Works)

- 3 animated step mockups
- CTA: "Get Started Free"

### 5. success.html (Post-purchase)

- Shows activation email after Stripe checkout
- 4-step activation instructions
- Loading/retry states

---

## Pricing

| Plan | Price | Type | Includes |
|------|-------|------|----------|
| Free Trial | Free | 30 days | Managed API keys, all features |
| Pro Monthly | $9/mo | Subscription | Managed keys, no setup, priority support |
| Pro Yearly | $59/yr | Subscription | Same as Monthly, save 45% ($4.92/mo) |
| Lifetime | $149 | One-time | BYOK (bring own API key), all features forever |
| BYOK | Free forever | After trial | Use own Groq/OpenAI API key |

### Trial Details
- Duration: 30 days from first use
- Server-side tracking tied to email + deviceId (prevents reinstall reset)
- Full access to managed API keys (Groq STT + Groq cleanup)
- After trial: add own API key (free forever) or upgrade

### Managed Mode
- Available for: Free Trial, Pro Monthly, Pro Yearly
- STT: Groq Whisper via `/api/proxy-stt`
- Cleanup: Groq Llama 3.3 via `/api/proxy-cleanup`
- Cost included in subscription

---

## API Endpoints (11 total, Vercel Hobby limit is 12)

### License & Checkout

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout` | POST | Create Stripe checkout session |
| `/api/get-license` | GET | Retrieve license after purchase |
| `/api/validate-license` | POST | Validate license or trial (24h cache, offline-safe) |
| `/api/customer-portal` | POST | Stripe billing portal (Pro only) |
| `/api/webhooks/stripe` | POST | Handle Stripe payment events |

### Managed Mode Proxies

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/proxy-stt` | POST | Server-side Groq Whisper (max 10MB audio) |
| `/api/proxy-cleanup` | POST | Server-side Groq Llama (5 actions: cleanup, generate, cleanupCode, refinePrompt, generateWithTemplate) |

### Analytics

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/track-usage` | POST | Fire-and-forget per-transcription analytics |

### Shared Libraries (not endpoints)

| Module | Purpose |
|--------|---------|
| `/api/lib/supabase.ts` | Supabase client init |
| `/api/lib/validate-email.ts` | Email format validation |
| `/api/lib/validate-user.ts` | User/trial validation for proxy endpoints |

---

## Database (Supabase)

| Table | Columns | Purpose |
|-------|---------|---------|
| `users` | id, email, trial_started_at, external_id | User accounts |
| `license_types` | id, slug, name, product_id, duration_days | Plan definitions |
| `user_licenses` | id, user_id, license_type_id, license_key, status, starts_at, expires_at, stripe_subscription_id, stripe_customer_id | License records |
| `usage_logs` | user_id, device_id, words, audio_seconds, stt_provider, cleanup_provider, language, created_at | Analytics |

---

## Environment Variables (Vercel)

```
GROQ_API_KEY                    # Server-side Groq key for managed mode
STRIPE_SECRET_KEY               # Stripe API key
STRIPE_WEBHOOK_SECRET           # Stripe webhook signing secret
STRIPE_PRICE_MONTHLY            # Stripe price ID for $9/mo
STRIPE_PRICE_YEARLY             # Stripe price ID for $59/yr
STRIPE_PRICE_LIFETIME           # Stripe price ID for $149 one-time
SUPABASE_URL                    # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role key
APP_URL                         # Default: https://voxgenflow.vercel.app
```

---

## All Settings Keys

### Recording
- `holdHotkey` — Hold-to-record hotkey
- `toggleHotkey` — Toggle recording hotkey
- `toggleTriggerMethod` — 'single' | 'double-tap'
- `promptHotkey` — AI Prompt mode hotkey
- `promptTriggerMethod` — 'single' | 'double-tap'
- `language` — Transcription language (default: 'en')
- `audioInputDeviceId` — Microphone device ID (default: 'default')

### STT / Cleanup
- `sttProvider` — 'groq' | 'openai' | 'local' | 'deepgram'
- `localModelSize` — 'tiny' | 'base' | 'small' | 'medium'
- `cleanupProvider` — 'groq' | 'openai' | 'none'
- `cleanupEnabled` — boolean

### AI Enhancement
- `codeMode` — boolean
- `outputLength` — 'concise' | 'medium' | 'detailed'
- `keywordTriggersEnabled` — boolean
- `promptRefinementEnabled` — boolean
- `fillerWordRemoval` — boolean
- `useClipboardContext` — boolean
- `useWindowContext` — boolean
- `customVocabulary` — string[]
- `wordReplacements` — Array<{ original, replacement, enabled }>

### Prompts & Power Modes
- `activePromptId` — string
- `powerModesEnabled` — boolean

### UI
- `theme` — 'dark' | 'light'
- `autoCopy` — boolean

### License
- `userEmail` — string
- `licenseStatus` — 'none' | 'active' | 'expired' | 'invalid'
- `licensePlan` — string
- `licenseExpiresAt` — string
- `trialStartedAt` — number
- `lastLicenseCheck` — number
- `deviceId` — string (persistent UUID)

### Onboarding
- `onboardingComplete` — boolean
- `sessionCount` — number

---

## Known Issues / Outdated Items

1. **Local whisper.cpp** — UI exists but backend not implemented
2. **Snippet IPC handlers** — Still in code but unused (snippets:get, snippets:set)
3. **Dark/Light theme toggle** — User considering removing in favor of single theme

---

## Competitor Taglines (avoid)

| Competitor | Tagline |
|------------|---------|
| Wispr Flow | "Don't type, just speak" / "Effortless Voice Dictation" |
| Typeless | "Speak, don't type" |
| Willow Voice | "AI-powered voice dictation that replaces your keyboard" |
| VoxGen | "Your voice, perfected." |
