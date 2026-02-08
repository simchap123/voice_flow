# VoiceFlow - AI Dictation App

System-wide AI dictation: press a global hotkey from any app, speak, and transcribed + AI-cleaned text gets typed into the focused application.

**Stack:** Electron 33 + React 19 + Vite 6 + TypeScript 5 + Tailwind 3 + shadcn/ui (Radix)

## Documentation

All detailed docs live in `docs/`:
- `docs/ARCHITECTURE.md` — Code structure, provider system, recording flow, IPC, local whisper plans
- `docs/PRD.md` — Product requirements, pricing, phases, technical decisions
- `docs/BACKEND_ARCHITECTURE.md` — Supabase + Stripe + Vercel API, DB schema, purchase flow
- `docs/USER_JOURNEY.md` — User flows, state machine, settings, trial/license

## Quick Reference

### Commands
```bash
npm run dev                 # Vite + Electron dev server with hot reload
npm run build               # tsc + vite build → dist/ + dist-electron/
npm run electron:build:win  # Build Windows .exe installer → release/
```

### Recording Flow
```
IDLE → RECORDING → PROCESSING_STT → PROCESSING_CLEANUP → INJECTING → IDLE
```

### Provider Architecture
```
Settings → Provider Factory → STT Provider → transcribe(audio, language) → text
                            → Cleanup Provider → cleanup(rawText) → cleanedText

STT:     OpenAI Whisper ($0.006/min) | Groq Whisper ($0.0007/min) | Local whisper.cpp (free, planned)
Cleanup: OpenAI GPT-4o-mini | Groq Llama 3.3 | None (disabled)
```

### Key Design Decisions
- **Two windows:** Main window (frameless) + Overlay window (transparent, always-on-top, 380x200)
- **Overlay detection:** `window.location.hash === '#/overlay'` in App.tsx
- **Text injection:** Clipboard + Ctrl+V (Win/Linux) or Cmd+V (macOS) via nut.js
- **API key security:** Encrypted per-provider with Electron safeStorage
- **ESM:** `"type": "module"` in package.json
- **Audio:** MediaRecorder API, WebM/Opus format

### Phase Status

| # | Phase | Status |
|---|-------|--------|
| 1-9 | Core app (scaffold, recording, STT, cleanup, injection, history, settings, snippets, overlay) | DONE |
| 10 | Packaging (NSIS installer) | DONE |
| 11 | Multi-provider STT (OpenAI + Groq) | DONE |
| 12 | Configurable hotkeys + modes | DONE |
| 13 | Local whisper.cpp (offline STT) | PLANNED |
| 14 | Licensing (Stripe + Supabase + Vercel) | DONE |

### Licensing
- **Free trial:** 7 days, no registration
- **BYOK:** Free forever with own API key
- **Pro:** $8/mo, $48/yr, or $39 lifetime via Stripe
- **Backend:** Vercel serverless + Supabase DB + Stripe payments
- **Validation:** /api/validate-license, cached 24h, offline-safe

### Environment Variables (Vercel)
```
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY, STRIPE_PRICE_LIFETIME
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
APP_URL
```

## Conventions
- Path alias: `@/` → `src/`
- CSS: Tailwind + CSS variables (HSL) for theming
- Components: Function components with hooks, no class components
- State: React hooks + electron-store (no Redux/Zustand)
- IPC: `ipcMain.handle()` + `ipcRenderer.invoke()` for async, `.on()` + `.send()` for fire-and-forget
- File naming: kebab-case for files, PascalCase for components
- Provider pattern: Interface → Implementation → Factory (for STT and Cleanup)

### Dependencies (important)
- `@nut-tree-fork/nut-js` (NOT the original nut-tree/nut-js — removed from npm)
- `electron-store` v8 (ESM-only)
- `openai` v4 (used for both OpenAI and Groq — Groq is OpenAI-compatible)
- `uiohook-napi` for global keyboard hooks
