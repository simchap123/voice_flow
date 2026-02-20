# VoxGen

AI-powered dictation and smart content generation that works everywhere. Hold a hotkey, speak, and polished text appears in any app — or trigger AI content generation with voice commands.

**[Download](https://voxgenflow.vercel.app)** | **[Releases](https://github.com/simchap123/VoxGen/releases)** | **[What's New](https://voxgenflow.vercel.app/whats-new.html)**

## Features

### Recording Modes
- **Hold-to-Record** — Hold a modifier key (e.g., Alt), speak, release to transcribe + paste
- **Toggle Recording** — Single-press or double-tap to start, press again to stop
- **AI Prompt Mode** — Speak instructions, AI generates full content (emails, code, summaries)

### AI Processing
- **Multi-provider STT** — Groq Whisper (fastest, ~$0.0007/min), OpenAI Whisper ($0.006/min), or managed cloud
- **AI Text Cleanup** — Removes filler words, fixes grammar and punctuation automatically
- **Code Mode** — Convert spoken words to code syntax
- **Keyword Triggers** — Say "write me an email about..." and AI generates structured content
- **Prompt Refinement** — AI cleans up rough spoken instructions before generating content
- **Filler Word Removal** — Strips "um", "uh", "like" before AI processing

### Context Intelligence
- **Clipboard Context** — AI uses clipboard content to fix names and terms
- **Active Window Detection** — Detects which app you're in (Gmail, Slack, VS Code) and adjusts behavior
- **Custom Vocabulary** — Up to 200 proper nouns and jargon the AI should know
- **Word Replacements** — Auto-correct specific words/phrases
- **Power Modes** — Auto-detect active app and apply custom AI settings per context

### AI Prompts
- **4 Built-in Prompts** — Default Cleanup, Chat Message, Email, Rewrite (all editable)
- **Custom Prompts** — Create your own AI cleanup/generation instructions
- **Prompt Picker** — Click the overlay to quickly switch active prompt

### History & Export
- **Transcription History** — Searchable log of all dictations
- **Recording Backup** — All recordings auto-saved as .webm files
- **Export** — Download recordings or export history to JSON

### Desktop App
- **System-wide** — Works in any application (Outlook, Word, Chrome, Slack, VS Code, etc.)
- **Always-on-top Overlay** — Minimal pill showing recording/processing state
- **System Tray** — Runs silently in the background
- **Auto-Update** — Downloads updates from GitHub Releases automatically
- **99+ Languages** — Whisper supports over 99 languages
- **Encrypted API Keys** — Stored with Windows DPAPI via Electron safeStorage

## Download

Get the latest release from [voxgenflow.vercel.app](https://voxgenflow.vercel.app) or the [GitHub Releases](https://github.com/simchap123/VoxGen/releases) page.

**Requirements:** Windows 10/11, 64-bit

## Quick Start

1. Download and run `VoxGen-Setup.exe`
2. Enter your email to start a 30-day free trial (managed API keys, no setup)
3. Hold **Alt** from anywhere to dictate — release to stop and paste
4. Double-tap **Alt** for AI Prompt mode (content generation)

Or bring your own API key from [Groq](https://console.groq.com/keys) or [OpenAI](https://platform.openai.com/api-keys) for free usage forever.

## Pricing

| Plan | Price | Includes |
|------|-------|----------|
| **Free Trial** | Free for 30 days | Managed API keys, all features |
| **Pro Monthly** | $9/mo | Managed keys, no setup, priority support |
| **Pro Yearly** | $59/yr | Same as Monthly, save 45% |
| **Lifetime** | $149 one-time | BYOK (bring own API key), all features forever |
| **BYOK** | Free forever | Use your own Groq/OpenAI API key after trial |

## Tech Stack

- **Electron 33** + **React 19** + **Vite 6** + **TypeScript 5**
- **Tailwind CSS 3** + **shadcn/ui** (Radix primitives)
- **uiohook-napi** for global keyboard hooks
- **@nut-tree-fork/nut-js** for cross-platform text injection
- **OpenAI SDK** for Whisper STT and GPT cleanup (works with Groq too)
- **Vercel** serverless API + **Supabase** database + **Stripe** payments

## Architecture

```
Recording Flow:  IDLE → RECORDING → PROCESSING_STT → PROCESSING_CLEANUP → INJECTING → IDLE

Provider System: Settings → Provider Factory → STT Provider → transcribe(audio) → text
                                              → Cleanup Provider → cleanup(text) → polished text

Two Windows:     Main Window (frameless, settings/history)
                 Overlay Window (transparent, always-on-top, recording state)

Text Injection:  Clipboard + Ctrl+V via nut.js
```

### API Endpoints (Vercel Serverless)

| Endpoint | Purpose |
|----------|---------|
| `/api/checkout` | Create Stripe checkout session |
| `/api/get-license` | Retrieve license after purchase |
| `/api/validate-license` | Validate license or trial (24h cache) |
| `/api/customer-portal` | Stripe billing portal |
| `/api/webhooks/stripe` | Handle Stripe payment events |
| `/api/proxy-stt` | Server-side Groq Whisper for trial/Pro |
| `/api/proxy-cleanup` | Server-side Groq Llama for trial/Pro |
| `/api/track-usage` | Fire-and-forget analytics |

### Database (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | Email, trial start, device tracking |
| `license_types` | trial, pro_monthly, pro_yearly, lifetime |
| `user_licenses` | License records, Stripe IDs, status, expiry |
| `usage_logs` | Per-transcription analytics |

## Development

```bash
npm install
npm run dev                 # Vite + Electron dev server with hot reload
npm run build               # Vite production build
npm run electron:build:win  # Build Windows installer → release/
```

## Documentation

See the `docs/` folder:
- [Architecture](docs/ARCHITECTURE.md) — code structure, providers, recording flow
- [Product Requirements](docs/PRD.md) — vision, pricing, phases, decisions
- [Backend Architecture](docs/BACKEND_ARCHITECTURE.md) — Supabase, Stripe, Vercel API
- [User Journey](docs/USER_JOURNEY.md) — user flows, state machine, purchase flow

## License

MIT
