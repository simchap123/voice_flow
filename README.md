# VoxGen

AI-powered dictation and smart content generation that works everywhere. Hold a hotkey, speak, and your words appear in any app -- or trigger content generation with keyword commands.

## Features

- **System-wide dictation** — works in any application (Outlook, Word, Chrome, Slack, etc.)
- **Hold-to-speak** — hold Alt (or any hotkey), speak, release to inject text
- **AI-powered cleanup** — raw transcription is cleaned up by AI for punctuation, grammar, and formatting
- **Multi-provider STT** — choose between Groq (fast & cheap) or OpenAI Whisper
- **Local offline mode** — whisper.cpp for free, private, offline speech-to-text (coming in v1.2)
- **Bring Your Own Key** — your API keys are encrypted locally and never leave your device
- **Text snippets** — define trigger words that expand into longer text
- **Transcription history** — searchable log of all your dictations
- **Configurable hotkeys** — hold mode, toggle mode, any key combo

## Download

Get the latest release from [voxgenflow.vercel.app](https://voxgenflow.vercel.app) or the [GitHub Releases](https://github.com/simchap123/VoxGen/releases) page.

## Quick Start

1. Download and run `VoxGen Setup.exe`
2. Get a free API key from [Groq](https://console.groq.com/keys) or [OpenAI](https://platform.openai.com/api-keys)
3. Open VoxGen Settings, select your provider, and paste the key
4. Hold **Alt** from anywhere to start dictating — release to stop

## Development

```bash
npm install
npm run dev                 # Vite + Electron dev server with hot reload
npm run build               # TypeScript + Vite production build
npm run electron:build:win  # Build Windows installer
```

## Tech Stack

- **Electron 33** + **React 19** + **Vite 6** + **TypeScript 5**
- **Tailwind CSS 3** + **shadcn/ui** (Radix primitives)
- **uiohook-napi** for global keyboard hooks
- **@nut-tree-fork/nut-js** for cross-platform text injection
- **OpenAI SDK** for Whisper STT and GPT text cleanup (works with Groq too)

## Pricing

- **Free trial** — 30 days with managed API key
- **Free forever** — bring your own API key
- **Pro Monthly** — $9/mo
- **Pro Yearly** — $59/yr
- **Lifetime** — $149 one-time (BYOK)

## Documentation

See the `docs/` folder for detailed documentation:
- [Architecture](docs/ARCHITECTURE.md) — code structure, providers, recording flow
- [Product Requirements](docs/PRD.md) — vision, pricing, phases, technical decisions
- [Backend Architecture](docs/BACKEND_ARCHITECTURE.md) — Supabase, Stripe, Vercel API
- [User Journey](docs/USER_JOURNEY.md) — user flows, state machine, purchase flow

## License

MIT
