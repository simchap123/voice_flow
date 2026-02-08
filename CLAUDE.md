# VoiceFlow - AI Dictation App

## Project Overview
System-wide AI dictation app: press a global hotkey from any app, speak, and the transcribed + AI-cleaned text gets typed into the focused application. Multi-provider STT with Groq (cheap) and OpenAI (premium) support. Local offline mode coming soon.

**Stack:** Electron 33 + React 19 + Vite 6 + TypeScript 5 + Tailwind 3 + shadcn/ui (Radix)

## Architecture

```
electron/main/          → Electron main process (Node.js)
  index.ts              → App entry, lifecycle, window creation, license check on startup
  windows.ts            → Main window + overlay window (transparent, always-on-top)
  hotkeys.ts            → Global hotkey registration (configurable, hold/toggle modes) + license gate
  tray.ts               → System tray icon + context menu
  ipc-handlers.ts       → IPC bridge: window controls, text injection, settings, history, snippets, license
  store.ts              → electron-store persistence + safeStorage encryption + license/trial fields
  text-injection.ts     → Clipboard + nut.js paste (cross-platform: Ctrl+V / Cmd+V)
  license.ts            → License key validation via Vercel API + canUseApp() gate + offline caching

electron/preload/       → Security boundary (contextBridge)
  index.ts              → Exposes electronAPI to renderer (API keys, license, trial events)
  types.ts              → TypeScript types for the bridge

src/                    → React renderer (Vite-built)
  App.tsx               → Routes: MainApp (full UI) vs OverlayApp (hash #/overlay)
  pages/                → DictationPage, HistoryPage, SettingsPage, SnippetsPage
  components/dictation/ → MicButton, WaveformVisualizer, StatusIndicator
  components/layout/    → TitleBar, Sidebar, OverlayShell (handles trial-expired event)
  components/history/   → History list + search
  components/settings/  → ProviderApiKeyInput, LanguageSelect, ThemeToggle, HotkeyRecorder, LicenseInput
  components/snippets/  → SnippetEditor, SnippetsList, ImportExport
  components/ui/        → shadcn/ui primitives (button, input, label, switch, etc.)
  hooks/                → Custom hooks (recording, waveform, settings, history, etc.)
  lib/
    stt/                → Pluggable STT providers
      types.ts          → STTProvider interface
      openai-whisper.ts → OpenAI Whisper provider
      groq-whisper.ts   → Groq Whisper provider (8.5x cheaper)
      provider-factory.ts → Factory pattern for provider selection
    cleanup/            → Pluggable AI cleanup providers
      types.ts          → CleanupProvider interface
      openai-cleanup.ts → GPT-4o-mini cleanup
      groq-cleanup.ts   → Groq Llama cleanup
      provider-factory.ts → Factory pattern for provider selection
    openai.ts           → Legacy OpenAI client (kept for backwards compat)
    audio-utils.ts      → Audio format conversion, duration formatting
    snippet-engine.ts   → Trigger word expansion
    cn.ts               → Tailwind class merge utility
  types/                → TypeScript interfaces (settings, transcription, snippets, license)

api/                    → Vercel serverless API functions
  package.json          → stripe + @supabase/supabase-js dependencies
  lib/supabase.ts       → Shared Supabase client (service_role key)
  checkout.ts           → POST: create Stripe Checkout session (monthly/yearly/lifetime)
  validate-license.ts   → POST: validate license key against Supabase
  get-license.ts        → GET: retrieve license key by Stripe session ID
  webhooks/stripe.ts    → POST: Stripe webhook handler (checkout.completed, subscription.deleted)

docs/                   → Architecture documentation
  BACKEND_ARCHITECTURE.md → Supabase + Stripe backend design for monetization

website/                → Marketing landing page (static HTML, deployed to Vercel)
  index.html            → Landing page with hero, features, pricing section, download CTA
  download.html         → Post-download setup instructions
  success.html          → Post-payment page with license key display + copy button

PRD.md                  → Product Requirements Document for v2
```

## Key Design Decisions
- **Two windows:** Main window (full app, frameless) + Overlay window (transparent, always-on-top, 380x200)
- **Overlay detection:** `window.location.hash === '#/overlay'` in App.tsx
- **Text injection:** Cross-platform: Ctrl+V (Windows/Linux) or Cmd+V (macOS) via nut.js
- **Multi-provider STT:** Pluggable provider architecture (OpenAI, Groq, Local planned)
- **Multi-provider cleanup:** Same pluggable pattern for AI text cleanup
- **API key security:** Encrypted per-provider with Electron safeStorage, backwards compat with v1 keys
- **ESM compatibility:** `"type": "module"` in package.json
- **Audio:** MediaRecorder API in renderer, WebM/Opus format
- **Hotkey modes:** Toggle (press to start/stop) and Hold (configurable)

## Provider Architecture
```
Settings → Provider Factory → STT Provider → transcribe(audio, language) → text
                            → Cleanup Provider → cleanup(rawText) → cleanedText

Providers:
  STT: OpenAI Whisper ($0.006/min) | Groq Whisper ($0.0007/min) | Local whisper.cpp (free, coming soon)
  Cleanup: OpenAI GPT-4o-mini | Groq Llama 3.3 | None (disabled)
```

## API Key Storage
- Multi-provider: keys stored as `api_key_{provider}` (encrypted) or `api_key_{provider}_plain` (fallback)
- Backwards compatible: reads legacy `openai_api_key` location for existing users
- Per-provider validation: OpenAI keys start with `sk-`, Groq keys start with `gsk_`
- Keys never leave device — audio goes directly to provider APIs

## Recording Flow
```
IDLE → RECORDING → PROCESSING_STT → PROCESSING_CLEANUP → INJECTING → IDLE
```

## Commands
```bash
npm run dev                 # Vite + Electron dev server with hot reload
npm run build               # tsc + vite build → dist/ + dist-electron/
npm run electron:build:win  # Build Windows .exe installer → release/

# Website preview
cd website && python -m http.server 8080

# Build installer (skip code signing)
npx vite build && CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --win --config.win.signAndEditExecutable=false
```

## Dependencies (important ones)
- `@nut-tree-fork/nut-js` (NOT the original nut-tree/nut-js - removed from npm)
- `electron-store` v8 (ESM-only, requires `"type": "module"`)
- `openai` v4 (used for both OpenAI and Groq — Groq is OpenAI-compatible)

## Phase Status

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 1 | Project scaffolding + Electron shell | DONE | Full main process, preload, IPC, windows |
| 2 | Audio recording + waveform | DONE | MediaRecorder, canvas waveform, analyser node |
| 3 | Whisper API integration | DONE | Multi-provider: OpenAI + Groq |
| 4 | GPT text cleanup | DONE | Multi-provider: OpenAI + Groq Llama |
| 5 | Text injection | DONE | Cross-platform: Ctrl+V / Cmd+V |
| 6 | Transcription history | DONE | HistoryPage, electron-store persistence |
| 7 | Settings panel | DONE | Provider selection, multi-key, hotkey config |
| 8 | User snippets | DONE | SnippetsPage, snippet-engine, import/export |
| 9 | Overlay polish + animations | DONE | Fade in/out, mic breathe, status transitions |
| 10 | Packaging | DONE | NSIS installer: `release/VoiceFlow Setup 1.1.0.exe` (86MB) |
| 11 | Multi-provider STT | DONE | OpenAI + Groq, pluggable architecture |
| 12 | Configurable hotkeys + modes | DONE | Hold/toggle modes, any modifier+key combo |
| 13 | Local whisper.cpp | PLANNED | Free offline STT, model download UI |
| 14 | Licensing system | DONE | Stripe + Supabase + Vercel API + 7-day trial |

## Licensing & Monetization
- **Free trial:** 7 days from first launch, no registration needed
- **BYOK (free forever):** User provides own OpenAI/Groq API key — no license needed
- **Pro Monthly ($8/mo):** Stripe subscription, license key in Supabase
- **Pro Yearly ($48/yr):** Stripe subscription, 50% savings vs monthly
- **Lifetime ($39):** One-time Stripe payment, never expires
- **Backend:** Vercel serverless functions (api/) + Supabase (DB) + Stripe (payments)
- **License flow:** Purchase on website → Stripe Checkout → webhook creates key in Supabase → user enters key in Settings → app validates via /api/validate-license → cached locally for 24h
- **Trial logic:** `trialStartedAt` stored in electron-store, `canUseApp()` checks trial OR active license
- **Supabase project:** `xsdngjfnsszulezxvsjd` — tables: users, products, license_types, user_licenses

## Licensing Architecture
```
Website pricing → /api/checkout → Stripe Checkout (hosted)
  → Payment → Stripe webhook → /api/webhooks/stripe
    → Upsert user + create license in Supabase (key auto-generated)
    → success.html fetches key via /api/get-license?session_id=...

App Settings → Enter license key → IPC license:validate
  → electron/main/license.ts → /api/validate-license
    → Returns { valid, plan, expiresAt } → cached in electron-store
    → Revalidated every 24h on startup, offline-safe (uses cache)

Recording gate: hotkeys.ts → canUseApp() → trial active OR license active
  → If blocked: overlay shows lock icon for 2s
```

## Environment Variables (Vercel)
```
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY, STRIPE_PRICE_LIFETIME
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
```

## Conventions
- Path alias: `@/` → `src/`
- CSS: Tailwind + CSS variables (HSL) for theming
- Components: Function components with hooks, no class components
- State: React hooks + electron-store (no Redux/Zustand)
- IPC pattern: `ipcMain.handle()` + `ipcRenderer.invoke()` for async, `.on()` + `.send()` for fire-and-forget
- File naming: kebab-case for files, PascalCase for components
- Provider pattern: Interface → Implementation → Factory (for STT and Cleanup)
