# VoiceFlow

AI-powered dictation that works everywhere. Hold a hotkey, speak, and your words appear in any app.

## Features

- **System-wide dictation** — works in any application (Outlook, Word, Chrome, Slack, etc.)
- **Hold-to-speak** — hold Alt (or any hotkey), speak, release to inject text
- **AI-powered cleanup** — raw transcription is cleaned up by AI for punctuation, grammar, and formatting
- **Multi-provider STT** — choose between Groq (fast & cheap) or OpenAI Whisper
- **Bring Your Own Key** — your API keys are encrypted locally and never leave your device
- **Text snippets** — define trigger words that expand into longer text
- **Transcription history** — searchable log of all your dictations
- **Configurable hotkeys** — hold mode, toggle mode, any key combo

## Download

Get the latest release from [freevoiceflow.vercel.app](https://freevoiceflow.vercel.app) or the [GitHub Releases](https://github.com/simchap123/voice_flow/releases) page.

## Quick Start

1. Download and run `VoiceFlow Setup.exe`
2. Get a free API key from [Groq](https://console.groq.com/keys) or [OpenAI](https://platform.openai.com/api-keys)
3. Open VoiceFlow Settings, select your provider, and paste the key
4. Hold **Alt** from anywhere to start dictating — release to stop

## Development

```bash
npm install
npm run dev          # Vite + Electron dev server with hot reload
npm run build        # TypeScript + Vite production build
npm run electron:build:win   # Build Windows installer
```

## Tech Stack

- **Electron 33** + **React 19** + **Vite 6** + **TypeScript 5**
- **Tailwind CSS 3** + **shadcn/ui** (Radix primitives)
- **uiohook-napi** for global keyboard hooks
- **@nut-tree-fork/nut-js** for cross-platform text injection
- **OpenAI SDK** for Whisper STT and GPT text cleanup (works with Groq too)

## Pricing

- **Free** — bring your own API key, use forever
- **Pro Monthly** — $8/mo
- **Pro Yearly** — $48/yr (save 50%)
- **Lifetime** — $39 one-time

## License

MIT
