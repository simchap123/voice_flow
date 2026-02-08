# VoiceFlow Architecture

## Overview

System-wide AI dictation app: press a global hotkey from any app, speak, and the transcribed + AI-cleaned text gets typed into the focused application.

**Stack:** Electron 33 + React 19 + Vite 6 + TypeScript 5 + Tailwind 3 + shadcn/ui (Radix)

## Code Structure

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
    openai.ts           → Legacy OpenAI client (backwards compat)
    audio-utils.ts      → Audio format conversion, duration formatting
    snippet-engine.ts   → Trigger word expansion
    cn.ts               → Tailwind class merge utility
  types/                → TypeScript interfaces (settings, transcription, snippets, license)

api/                    → Vercel serverless API functions
  lib/supabase.ts       → Shared Supabase client (service_role key)
  checkout.ts           → POST: create Stripe Checkout session
  validate-license.ts   → POST: validate license key against Supabase
  get-license.ts        → GET: retrieve license key by Stripe session ID
  webhooks/stripe.ts    → POST: Stripe webhook handler

website/                → Marketing landing page (static HTML, deployed to Vercel)
  index.html            → Landing page with hero, features, pricing, download CTA
  download.html         → Post-download setup instructions
  success.html          → Post-payment license key display + copy button
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
  STT:     OpenAI Whisper ($0.006/min) | Groq Whisper ($0.0007/min) | Local whisper.cpp (free, planned)
  Cleanup: OpenAI GPT-4o-mini | Groq Llama 3.3 | None (disabled)
```

### API Key Storage

- Multi-provider: keys stored as `api_key_{provider}` (encrypted) or `api_key_{provider}_plain` (fallback)
- Backwards compatible: reads legacy `openai_api_key` location for existing users
- Per-provider validation: OpenAI keys start with `sk-`, Groq keys start with `gsk_`
- Keys never leave device — audio goes directly to provider APIs

## Recording Flow

```
IDLE → RECORDING → PROCESSING_STT → PROCESSING_CLEANUP → INJECTING → IDLE
```

### State Machine

```
IDLE → RECORDING           (startRecording / hotkey press)
RECORDING → PROCESSING_STT (stopRecording / hotkey release)
RECORDING → CANCELLED      (cancelRecording / Escape)
PROCESSING_STT → PROCESSING_CLEANUP  (if cleanup enabled)
PROCESSING_STT → INJECTING          (if no cleanup)
PROCESSING_CLEANUP → INJECTING
INJECTING → IDLE           (text pasted into focused app)
CANCELLED → IDLE           (reset)
```

## Complete Dictation Flow

1. User presses hotkey (e.g., Alt+Space) from any app
2. Overlay window appears, mic activates
3. User speaks, waveform visualization shows
4. User releases hotkey (or presses again in toggle mode)
5. Audio sent to STT provider (Whisper API)
6. Raw text optionally sent to AI cleanup provider
7. Snippet trigger words expanded if defined
8. Text copied to clipboard, Ctrl+V/Cmd+V simulated via nut.js
9. Previous clipboard restored, overlay hides
10. Text appears in the focused application
11. Result saved to history

## Local Whisper (Planned — v1.2)

Offline STT using whisper.cpp, zero cloud dependency:

- **Library:** `@nicepkg/whisper.cpp` or `@kutalia/whisper-node-addon` (pre-built binaries)
- **Default model:** `whisper-base` (~142MB, ~8-9% WER)
- **First run:** "Downloading speech model... (142MB)" with progress bar
- **Audio format:** Convert WebM blob to WAV (16kHz mono) before passing to whisper.cpp

**Model storage:**
```
%APPDATA%/voiceflow/models/
  ├── ggml-base.bin      (142MB)
  ├── ggml-small.bin     (466MB, optional)
  └── ggml-medium.bin    (1.5GB, optional)
```

## IPC Patterns

- **Async (request/response):** `ipcMain.handle()` + `ipcRenderer.invoke()`
- **Fire-and-forget:** `.on()` + `.send()`

### Key IPC channels
```
license:validate  → validates key via API, stores result
license:get-info  → returns cached license info
license:clear     → removes stored license
trial-expired     → event sent to overlay when recording blocked
```

## Dependencies (important)

- `@nut-tree-fork/nut-js` (NOT the original nut-tree/nut-js — removed from npm)
- `electron-store` v8 (ESM-only, requires `"type": "module"`)
- `openai` v4 (used for both OpenAI and Groq — Groq is OpenAI-compatible)
- `uiohook-napi` for global keyboard hooks (keydown/keyup events)
