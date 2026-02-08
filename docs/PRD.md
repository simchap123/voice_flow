# VoiceFlow v2 — Product Requirements Document

## Vision

The cheapest, easiest, most flexible system-wide voice dictation app. Works offline out of the box. Optional cloud upgrade for power users. Beats Wispr Flow on price, privacy, and simplicity.

## Positioning

```
Wispr Flow:  "Best AI dictation"      — $15/mo, cloud-only, sends screenshots
VoiceFlow:   "Same quality, private"  — Free offline + $8/mo cloud Pro
```

## Target Users

1. **Casual user** — Wants voice-to-text without thinking about API keys or setup
2. **Power user** — Wants best accuracy, willing to pay or bring own API key
3. **Privacy-conscious** — Wants everything local, no cloud, no tracking
4. **Developer** — Uses it while coding, wants it fast and unobtrusive

## Pricing Tiers

| Tier | Price | STT | AI Cleanup | Features |
|------|-------|-----|------------|----------|
| **Free** | $0 forever | Local whisper.cpp | Local LLM (optional) | Unlimited offline, all hotkey modes, snippets, history |
| **Pro** | $8/mo or $39 lifetime | Groq Whisper cloud | Groq Llama 3.3 | Faster + more accurate, cloud history sync |
| **BYOK** | Free (user pays API) | OpenAI / Groq / Deepgram | OpenAI / Groq / any | Full provider choice, advanced settings |

## Phase 1: Desktop App Excellence (Done)

- Multi-provider STT architecture (OpenAI + Groq, pluggable)
- Hold-to-record + configurable hotkeys via uiohook-napi
- AI text cleanup (GPT-4o-mini, Groq Llama)
- Text snippets, transcription history, overlay UI
- NSIS installer for Windows

## Phase 2: Backend + Monetization (Done)

- Stripe billing (monthly $8, yearly $48, lifetime $39)
- Supabase Postgres for license keys + user records
- Vercel serverless API (checkout, webhook, validate-license, get-license)
- 7-day free trial built into app locally
- License validation with 24h offline caching

## Phase 3: Local Offline Mode (Planned — v1.2)

- Local whisper.cpp for free offline STT
- Model download UI with progress bar (base 142MB, small 466MB, medium 1.5GB)
- Local LLM cleanup via node-llama-cpp (optional)
- App works fully offline with zero setup beyond model download

## Phase 4: Growth Features (Future)

- **Context awareness:** Read active window title, adjust cleanup tone (formal for Outlook, casual for Slack)
- **Voice activity detection (VAD):** Silero VAD to auto-trim silence
- **Personal dictionary:** Custom words/jargon passed as hints to STT
- **Cloud history sync:** Encrypted sync across devices (Pro only)

## Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Electron | Codebase exists, works, ship fast. Tauri later if needed |
| Local STT | whisper.cpp | Most mature, best Node.js bindings |
| Cloud STT | Groq Whisper | 8.5x cheaper than OpenAI, identical accuracy |
| Local LLM | node-llama-cpp | First-class Electron support |
| Cloud LLM | Groq Llama 3.3 | Cheapest, fastest, OpenAI-compatible |
| Hotkey lib | uiohook-napi | Key up/down events, cross-platform |
| Auth | Supabase | Free tier, built-in auth + DB |
| Billing | Stripe | Industry standard, hosted checkout |
| Hosting | Vercel + Supabase | Generous free tiers |

## Non-Goals

- Mobile app (desktop first)
- Meeting recording / audio file transcription
- Real-time streaming transcription (batch is fine for dictation)
- Speaker diarization (single speaker only)
- Video transcription
- Building our own speech model

## Success Metrics

- **Week 1:** App works offline, hold-to-record works, 3 STT providers available
- **Month 1:** 500+ downloads, 50+ Pro subscribers ($400/mo revenue)
- **Month 3:** 2,000+ downloads, 200+ Pro subscribers ($1,600/mo revenue)
- **Month 6:** macOS support, 1,000+ Pro subscribers ($8,000/mo revenue)
