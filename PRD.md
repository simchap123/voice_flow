# VoiceFlow v2 — Product Requirements Document

## Vision
The cheapest, easiest, most flexible system-wide voice dictation app. Works offline out of the box. Optional cloud upgrade for power users. Beats Wispr Flow on price, privacy, and simplicity.

## Positioning
```
Wispr Flow:  "Best AI dictation"      — $15/mo, cloud-only, sends screenshots
VoiceFlow:   "Same quality, private"  — Free offline + $8/mo cloud Pro
```

## Target Users
1. **Casual user** — Wants voice-to-text, doesn't want to think about API keys or setup
2. **Power user** — Wants best accuracy, willing to pay or bring own API key
3. **Privacy-conscious** — Wants everything local, no cloud, no tracking
4. **Developer** — Uses it while coding, wants it fast and unobtrusive

---

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│  VoiceFlow Desktop App (Electron)                │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  STT Engine (pluggable)                    │  │
│  │  ├── Local: whisper.cpp (free, offline)    │  │
│  │  ├── Cloud: Groq Whisper (fast, cheap)     │  │
│  │  ├── Cloud: OpenAI Whisper (BYOK)          │  │
│  │  └── Cloud: Deepgram (BYOK)               │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  AI Cleanup Engine (pluggable)             │  │
│  │  ├── Local: node-llama-cpp (free, offline) │  │
│  │  ├── Cloud: Groq Llama 3.3 (cheap)        │  │
│  │  ├── Cloud: OpenAI GPT-4o-mini (BYOK)     │  │
│  │  └── None (raw transcription only)         │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  Hotkey System (uiohook-napi)              │  │
│  │  ├── Hold-to-record (default)              │  │
│  │  ├── Toggle (press start / press stop)     │  │
│  │  └── Fully customizable key combos         │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  Text Injection (cross-platform)           │  │
│  │  ├── Windows: Ctrl+V via nut.js            │  │
│  │  ├── macOS: Cmd+V via nut.js               │  │
│  │  └── Clipboard fallback                    │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
         │ (Pro tier only)
         ▼
┌──────────────────────────────────────────────────┐
│  VoiceFlow Backend (serverless)                  │
│                                                  │
│  ├── Auth: Supabase (email + Google OAuth)       │
│  ├── Billing: Stripe (subscription + lifetime)   │
│  ├── API Proxy: Edge function → Groq APIs        │
│  ├── Usage Metering: words/month per user        │
│  └── License Validation: check on app startup    │
│                                                  │
│  Hosting: Vercel (edge functions) or Supabase    │
│  Cost: ~$1-2/user/month on Groq                  │
│  Revenue: $8/user/month or $39 lifetime          │
└──────────────────────────────────────────────────┘
```

---

## Pricing Tiers

| Tier | Price | STT | AI Cleanup | Features |
|------|-------|-----|------------|----------|
| **Free** | $0 forever | Local whisper.cpp | Local LLM (optional) | Unlimited offline, all hotkey modes, snippets, history |
| **Pro** | $8/mo or $39 lifetime | Groq Whisper cloud | Groq Llama 3.3 | Faster + more accurate, cloud history sync |
| **BYOK** | Free (user pays API) | OpenAI / Groq / Deepgram | OpenAI / Groq / any | Full provider choice, advanced settings |

---

## Phase 1: Desktop App Excellence (No Backend Needed)

### 1A. Multi-Provider STT Architecture
**Goal:** Pluggable STT so we can swap providers without rewriting the app.

**Design:**
```typescript
// src/lib/stt/types.ts
interface STTProvider {
  name: string
  transcribe(audio: Blob, language: string): Promise<string>
  isAvailable(): Promise<boolean>
}

// src/lib/stt/local-whisper.ts    — whisper.cpp via addon
// src/lib/stt/groq-whisper.ts     — Groq cloud API
// src/lib/stt/openai-whisper.ts   — OpenAI cloud API (current)
// src/lib/stt/provider-factory.ts — Returns correct provider from settings
```

**Settings:**
- `sttProvider`: `'local' | 'groq' | 'openai' | 'deepgram'`
- `localModelSize`: `'tiny' | 'base' | 'small' | 'medium'`
- `cloudApiKey`: encrypted string (per provider)

### 1B. Local Whisper.cpp Integration
**Goal:** App works out of the box with zero setup.

**Implementation:**
- Use `@nicepkg/whisper.cpp` or `@kutalia/whisper-node-addon` (pre-built binaries)
- Default model: `whisper-base` (~142MB, ~8-9% WER, good enough for dictation)
- First-run experience: "Downloading speech model... (142MB)" with progress bar
- Model stored in app data directory
- Audio format: Convert WebM blob to WAV (16kHz mono) before passing to whisper.cpp
- Fallback: If local fails, prompt user to try cloud provider

**Model Storage:**
```
%APPDATA%/voiceflow/models/
  ├── ggml-base.bin      (142MB)
  ├── ggml-small.bin     (466MB, optional download)
  └── ggml-medium.bin    (1.5GB, optional download)
```

### 1C. Hold-to-Record + Configurable Hotkeys
**Goal:** Natural "press, speak, release" UX like Wispr Flow.

**Implementation:**
- Replace `electron.globalShortcut` with `uiohook-napi`
- `uiohook-napi` provides global `keydown` and `keyup` events
- Support two modes:
  - **Hold mode (default):** keydown = start recording, keyup = stop + transcribe + inject
  - **Toggle mode:** keydown = toggle recording on/off
- Hotkey picker in Settings (already partially built)
- Default: Alt+Space (keep current)
- Store: `hotkeyMode: 'hold' | 'toggle'`, `hotkey: string`

**Key combos supported:**
- Single modifier: `Alt`, `Ctrl`, `Shift`, `Meta/Win`
- Modifier + key: `Alt+Space`, `Ctrl+Shift+D`, `Alt+H`
- Function keys: `F5`, `F6`, etc.

### 1D. Critical Bug Fixes
**Must fix before anything else:**

1. **API call timeouts** — Add 15s timeout on STT, 10s on cleanup
2. **Hotkey race condition** — Debounce rapid presses, sync state with renderer
3. **Cross-platform text injection** — Detect OS, use Cmd+V on macOS
4. **nut.js import race** — Await the dynamic import properly
5. **Audio codec detection** — Fallback from WebM/Opus to WebM/PCM if needed
6. **Error boundaries** — Catch React rendering errors gracefully

### 1E. Settings UI Updates
**New settings sections:**

```
[Speech Recognition]
  Provider:     [Local (Free)] [Groq Cloud] [OpenAI] [Custom]
  Local Model:  [Base (142MB)] [Small (466MB)] [Medium (1.5GB)]
  [Download Model] button with progress bar

[Recording]
  Mode:         [Hold to Record] [Toggle]
  Hotkey:       [Alt + Space] [Change...]

[AI Cleanup]
  Enabled:      [toggle]
  Provider:     [Local (Free)] [Groq] [OpenAI] [None]

[API Keys]  (only shown when cloud provider selected)
  Groq API Key:    [••••••••] [Save]
  OpenAI API Key:  [••••••••] [Save]

[Account]  (Phase 2 - Pro tier)
  [Sign In] or [Create Account]
  Plan: Free | Pro ($8/mo)
  Usage: 12,450 / unlimited words this month
```

---

## Phase 2: Backend + Monetization

### 2A. Auth System (Supabase)
**Why Supabase:** Free tier generous (50K MAU), built-in auth, Postgres DB, edge functions. No server to manage.

**Auth flows:**
- Email + password signup/login
- Google OAuth (one-click)
- Session token stored in electron-store (encrypted)
- Auth state synced to renderer via IPC

**Database schema (Supabase Postgres):**
```sql
-- Users (managed by Supabase Auth)
-- Additional profile data:
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  plan TEXT DEFAULT 'free',          -- 'free', 'pro', 'lifetime'
  stripe_customer_id TEXT,
  words_used_this_month INTEGER DEFAULT 0,
  words_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  words INTEGER,
  provider TEXT,                      -- 'groq', 'openai'
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2B. Billing (Stripe)
**Plans:**
- **Free:** No Stripe, no payment
- **Pro Monthly:** $8/mo via Stripe Checkout
- **Pro Lifetime:** $39 one-time via Stripe Checkout
- Stripe webhook → Supabase edge function → update `profiles.plan`

**Lifecycle:**
```
User clicks "Upgrade to Pro" in Settings
  → Opens Stripe Checkout in browser
  → User pays
  → Stripe webhook fires
  → Supabase edge function updates plan
  → App polls for plan change (or listens via realtime)
  → Pro features unlock
```

### 2C. API Proxy (Edge Functions)
**Why proxy:** Your Groq API key stays on the server, not in the app.

**Flow:**
```
App → POST /api/transcribe (audio blob + auth token)
  → Edge function validates token
  → Checks usage limits (free: 2000 words/week)
  → Forwards to Groq Whisper API
  → Logs usage
  → Returns transcription
```

**Implementation:** Supabase Edge Functions (Deno) or Vercel Edge Functions (Node.js)

**Rate limiting:**
- Free: 2,000 words/week
- Pro: Unlimited (soft limit: 500,000 words/month for abuse prevention)

### 2D. License Validation
**On app startup:**
```
1. Check electron-store for cached auth token
2. If token exists, validate against Supabase (with 5s timeout)
3. If valid + Pro plan → unlock cloud features
4. If invalid or no token → free tier (local only, still fully functional)
5. Cache validation result for 24h (offline grace period)
```

**Important:** Free tier works without ANY server communication. The app never phones home unless you're using Pro cloud features.

---

## Phase 3: Growth Features (Future)

### 3A. Context Awareness (Lite)
- Read active window title (not screenshot like Wispr Flow)
- Adjust cleanup prompt based on app: "formal" for Outlook, "casual" for Slack, "technical" for VS Code
- Privacy-friendly: only window title, never screen content

### 3B. Voice Activity Detection (VAD)
- Integrate Silero VAD (like Handy does)
- Auto-trim silence from beginning/end of recording
- Faster transcription, better accuracy

### 3C. Personal Dictionary
- User adds custom words (names, jargon, acronyms)
- Passed as prompt hints to Whisper API or local model
- Improves accuracy for domain-specific vocabulary

### 3D. Cloud History Sync (Pro)
- Encrypted sync of transcription history across devices
- Supabase realtime for live updates
- End-to-end encrypted (only user can read their history)

---

## Build Order (What to Do First)

```
WEEK 1: Desktop Excellence
├── Day 1-2: Multi-provider STT architecture + Groq integration
├── Day 2-3: Local whisper.cpp integration + model download
├── Day 3-4: Hold-to-record + configurable hotkeys (uiohook-napi)
├── Day 4-5: Critical bug fixes (timeouts, race conditions, cross-platform)
└── Day 5:   Settings UI updates for all new features

WEEK 2: Backend + Monetization
├── Day 1-2: Supabase project setup + auth (email + Google)
├── Day 2-3: Stripe integration + billing webhooks
├── Day 3-4: API proxy edge function for Groq
├── Day 4-5: Usage metering + rate limiting
└── Day 5:   Desktop app ↔ backend integration

WEEK 3: Polish + Launch
├── Day 1-2: Testing, edge cases, error handling
├── Day 3:   Update website with new features + pricing
├── Day 4:   Build installer, test on clean Windows machine
└── Day 5:   Launch on Product Hunt, Hacker News, Reddit
```

---

## Success Metrics
- **Week 1:** App works offline, hold-to-record works, 3 STT providers available
- **Month 1:** 500+ downloads, 50+ Pro subscribers ($400/mo revenue)
- **Month 3:** 2,000+ downloads, 200+ Pro subscribers ($1,600/mo revenue)
- **Month 6:** macOS support, 1,000+ Pro subscribers ($8,000/mo revenue)

---

## Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Electron (keep) | Codebase exists, works, ship fast. Migrate to Tauri later if needed |
| Local STT | whisper.cpp | Most mature, best Node.js bindings, identical to Whisper API quality |
| Cloud STT | Groq Whisper | 8.5x cheaper than OpenAI, identical accuracy, OpenAI-compatible API |
| Local LLM | node-llama-cpp | First-class Electron support, good docs |
| Cloud LLM | Groq Llama 3.3 | Cheapest, fastest, OpenAI-compatible API |
| Hotkey lib | uiohook-napi | Key up/down events, cross-platform, active maintenance |
| Auth | Supabase | Free tier, built-in auth + DB + edge functions, no server management |
| Billing | Stripe | Industry standard, Checkout hosted pages, webhooks |
| Hosting | Vercel (website) + Supabase (backend) | Both have generous free tiers |

---

## Non-Goals (Explicitly Out of Scope)
- Mobile app (focus on desktop first)
- Meeting recording / transcription of audio files
- Real-time streaming transcription (batch is fine for dictation)
- Speaker diarization (single speaker only)
- Video transcription
- Building our own speech model
