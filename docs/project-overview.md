# VoxGen — Project Overview

## What Is VoxGen?

VoxGen is an AI-powered system-wide dictation and content generation desktop application. Press a global hotkey from any app, speak, and transcribed + AI-cleaned text gets typed into the focused application. Keyword triggers activate structured content generation (emails, summaries, blog posts) from voice prompts.

## Repository Structure

**Type:** Multi-part monorepo (3 parts in one repository)

| Part | Path | Technology | Purpose |
|------|------|-----------|---------|
| Desktop App | `electron/` + `src/` | Electron 33 + React 19 + TypeScript 5.7 | Main product — desktop dictation app |
| API Backend | `api/` | Vercel serverless (Node.js) | License validation, payments, managed-mode proxies |
| Marketing Website | `website/` | Static HTML/CSS | Landing page, download, changelog |

## Technology Stack

| Category | Technology | Version | Notes |
|----------|-----------|---------|-------|
| Desktop Shell | Electron | 33.3.1 | Two windows: main (frameless) + overlay (transparent) |
| UI Framework | React | 19.0.0 | Function components + hooks only |
| Language | TypeScript | 5.7.3 | Strict mode, ES2020 target |
| Build Tool | Vite | 6.0.7 | + vite-plugin-electron 0.28.8 |
| Styling | Tailwind CSS | 3.4.17 | v3, NOT v4. HSL CSS variable theming |
| Components | shadcn/ui (Radix UI) | — | Sage green + cream brand colors |
| Routing | react-router-dom | 7.1.1 | Hash-based routing for overlay detection |
| STT | openai SDK | 4.77.0 | Used for OpenAI, Groq (OpenAI-compatible), Deepgram |
| Local STT | @huggingface/transformers | 3.8.1 | Experimental local whisper support |
| Text Injection | @nut-tree-fork/nut-js | 4.2.6 | Clipboard + paste simulation |
| Hotkeys | uiohook-napi | 1.5.4 | Global keyboard hooks (native addon) |
| Storage | electron-store | 8.2.0 | ESM-only, encrypted via safeStorage |
| Auto-Update | electron-updater | 6.7.3 | GitHub Releases distribution |
| Payments | Stripe | — | Checkout, subscriptions, webhooks |
| Database | Supabase (PostgreSQL) | — | User accounts, licenses, usage tracking |
| Hosting | Vercel | Hobby plan | Serverless functions (11/12 limit) |

## Architecture Pattern

**Desktop App:** Two-process Electron architecture with provider pattern

```
Main Process (Node.js)          Renderer Process (Browser/React)
├── electron/main/index.ts      ├── src/App.tsx
├── ipc-handlers.ts             ├── src/pages/
├── hotkeys.ts                  ├── src/components/
├── windows.ts                  ├── src/hooks/
├── text-injection.ts           ├── src/lib/stt/
├── store.ts                    ├── src/lib/cleanup/
├── license.ts                  └── src/lib/power-modes/
├── updater.ts
└── tray.ts
        ↕ IPC via preload bridge (contextBridge)
    electron/preload/index.ts
```

**Recording Flow:**
```
IDLE → RECORDING → PROCESSING_STT → PROCESSING_CLEANUP → INJECTING → IDLE
```

**Provider System:**
```
Settings → Provider Factory → STT Provider → transcribe(audio, language) → text
                            → Cleanup Provider → cleanup(rawText) → cleanedText

STT types:     local | groq | openai | deepgram | managed
Cleanup types: groq | openai | managed | none
```

## Licensing Model

| Tier | Price | Features |
|------|-------|----------|
| Free Trial | $0 (30 days) | Full features, server-side time tracking |
| BYOK | Free forever | Bring-your-own API keys (after trial or with Lifetime) |
| Pro | $9/mo or $59/yr | Managed API keys via Stripe subscription |
| Lifetime | $149 one-time | BYOK access, one-time payment |

Activation is email-based (no license keys). Backend: Vercel serverless + Supabase DB + Stripe.

## Current Version: v2.16.4
