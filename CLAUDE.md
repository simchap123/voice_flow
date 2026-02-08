# VoiceFlow - AI Dictation App

## Project Overview
System-wide AI dictation app: press a global hotkey from any app, speak, and the transcribed + AI-cleaned text gets typed into the focused application. Multi-provider STT with Groq (cheap) and OpenAI (premium) support. Local offline mode coming soon.

**Stack:** Electron 33 + React 19 + Vite 6 + TypeScript 5 + Tailwind 3 + shadcn/ui (Radix)

## Architecture

```
electron/main/          → Electron main process (Node.js)
  index.ts              → App entry, lifecycle, window creation
  windows.ts            → Main window + overlay window (transparent, always-on-top)
  hotkeys.ts            → Global hotkey registration (configurable, hold/toggle modes)
  tray.ts               → System tray icon + context menu
  ipc-handlers.ts       → IPC bridge: window controls, text injection, settings, history, snippets
  store.ts              → electron-store persistence + safeStorage encryption for multi-provider API keys
  text-injection.ts     → Clipboard + nut.js paste (cross-platform: Ctrl+V / Cmd+V)

electron/preload/       → Security boundary (contextBridge)
  index.ts              → Exposes electronAPI to renderer (multi-provider API key support)
  types.ts              → TypeScript types for the bridge

src/                    → React renderer (Vite-built)
  App.tsx               → Routes: MainApp (full UI) vs OverlayApp (hash #/overlay)
  pages/                → DictationPage, HistoryPage, SettingsPage, SnippetsPage
  components/dictation/ → MicButton, WaveformVisualizer, StatusIndicator
  components/layout/    → TitleBar, Sidebar, OverlayShell
  components/history/   → History list + search
  components/settings/  → ProviderApiKeyInput, LanguageSelect, ThemeToggle, HotkeyRecorder
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
  types/                → TypeScript interfaces (settings, transcription, snippets)

docs/                   → Architecture documentation
  BACKEND_ARCHITECTURE.md → Supabase + Stripe backend design for monetization

website/                → Marketing landing page (static HTML)
  index.html            → Landing page with hero, features, download CTA
  download.html         → Post-download setup instructions

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
| 10 | Packaging | DONE | NSIS installer: `release/VoiceFlow Setup 1.0.0.exe` (86MB) |
| 11 | Multi-provider STT | DONE | OpenAI + Groq, pluggable architecture |
| 12 | Configurable hotkeys + modes | DONE | Hold/toggle modes, any modifier+key combo |
| 13 | Local whisper.cpp | PLANNED | Free offline STT, model download UI |
| 14 | Backend + monetization | PLANNED | Supabase auth, Stripe billing, API proxy |

## Monetization Plan
- **Free:** Local whisper.cpp (offline, unlimited) — coming soon
- **Pro ($8/mo or $39 lifetime):** Groq cloud (fast, accurate) via managed API proxy
- **BYOK:** User provides own OpenAI/Groq key (current default)
- Backend: Supabase (auth + DB) + Stripe (billing) + Edge Functions (API proxy)
- See `docs/BACKEND_ARCHITECTURE.md` for full design

## Conventions
- Path alias: `@/` → `src/`
- CSS: Tailwind + CSS variables (HSL) for theming
- Components: Function components with hooks, no class components
- State: React hooks + electron-store (no Redux/Zustand)
- IPC pattern: `ipcMain.handle()` + `ipcRenderer.invoke()` for async, `.on()` + `.send()` for fire-and-forget
- File naming: kebab-case for files, PascalCase for components
- Provider pattern: Interface → Implementation → Factory (for STT and Cleanup)
