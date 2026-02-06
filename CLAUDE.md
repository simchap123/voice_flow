# VoiceFlow - AI Dictation App

## Project Overview
System-wide AI dictation app: press a global hotkey (Alt+Space) from any app, speak, and the transcribed + AI-cleaned text gets typed into the focused application.

**Stack:** Electron 33 + React 19 + Vite 6 + TypeScript 5 + Tailwind 3 + shadcn/ui (Radix)

## Architecture

```
electron/main/          → Electron main process (Node.js)
  index.ts              → App entry, lifecycle, window creation
  windows.ts            → Main window + overlay window (transparent, always-on-top)
  hotkeys.ts            → Global hotkey registration (Alt+Space, Escape)
  tray.ts               → System tray icon + context menu
  ipc-handlers.ts       → IPC bridge: window controls, text injection, settings, history, snippets
  store.ts              → electron-store persistence + safeStorage encryption for API keys
  text-injection.ts     → Clipboard + nut.js Ctrl+V paste into focused app

electron/preload/       → Security boundary (contextBridge)
  index.ts              → Exposes electronAPI to renderer
  types.ts              → TypeScript types for the bridge

src/                    → React renderer (Vite-built)
  App.tsx               → Routes: MainApp (full UI) vs OverlayApp (hash #/overlay)
  pages/                → DictationPage, HistoryPage, SettingsPage, SnippetsPage
  components/dictation/ → MicButton, WaveformVisualizer, StatusIndicator
  components/layout/    → TitleBar, Sidebar, OverlayShell
  components/history/   → History list + search
  components/settings/  → ApiKeyInput, LanguageSelect, ThemeToggle
  components/snippets/  → SnippetEditor, SnippetsList, ImportExport
  components/ui/        → shadcn/ui primitives (button, input, label, switch, etc.)
  hooks/                → 9 custom hooks (recording, waveform, settings, history, etc.)
  lib/                  → openai.ts, audio-utils.ts, snippet-engine.ts, cn.ts
  types/                → TypeScript interfaces

website/                → Marketing landing page (static HTML)
  index.html            → Landing page with hero, features, download CTA
  download.html         → Post-download setup instructions (3 steps + API key guide)
```

## Key Design Decisions
- **Two windows:** Main window (full app, frameless) + Overlay window (transparent, always-on-top, 380x200)
- **Overlay detection:** `window.location.hash === '#/overlay'` in App.tsx
- **Text injection:** Write to clipboard → nut.js simulates Ctrl+V → restore previous clipboard
- **API key security:** Encrypted with Electron safeStorage (DPAPI on Windows), fallback to plaintext
- **ESM compatibility:** `"type": "module"` in package.json; electron main uses `fileURLToPath(import.meta.url)` instead of `__dirname`
- **Audio:** MediaRecorder API in renderer, sends blob to OpenAI Whisper API
- **AI cleanup:** GPT-4o-mini post-processes transcription (optional, toggled in settings)
- **Snippet expansion:** Custom engine matches trigger words in transcribed text

## API Key Storage (for end users)
- Users enter their OpenAI API key in the **Settings** page of the app
- The key is encrypted with **Electron safeStorage** (Windows DPAPI) and stored locally
- The key never leaves the device - audio goes directly to OpenAI's API
- No server, no middleman, no account needed
- Path: `electron/main/store.ts` handles encryption/decryption
- UI: `src/components/settings/ApiKeyInput.tsx` for the input field

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
cd website && python -m http.server 8080   # Then open http://localhost:8080

# Build installer (skip code signing - no certificate)
npx vite build && CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --win --config.win.signAndEditExecutable=false
```

## Dependencies (important ones)
- `@nut-tree-fork/nut-js` (NOT the original nut-tree/nut-js - it's removed from npm)
- `electron-store` v8 (ESM-only, requires `"type": "module"` in package.json)
- `openai` v4 (Whisper STT + GPT-4o-mini cleanup)

## Phase Status

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 1 | Project scaffolding + Electron shell | DONE | Full main process, preload, IPC, windows |
| 2 | Audio recording + waveform | DONE | MediaRecorder, canvas waveform, analyser node |
| 3 | Whisper API integration | DONE | openai.ts, useWhisperTranscription hook |
| 4 | GPT text cleanup | DONE | useGptCleanup hook, GPT-4o-mini |
| 5 | Text injection | DONE | nut.js Ctrl+V, clipboard preserve/restore |
| 6 | Transcription history | DONE | HistoryPage, electron-store persistence |
| 7 | Settings panel | DONE | SettingsPage, all settings wired up |
| 8 | User snippets | DONE | SnippetsPage, snippet-engine, import/export |
| 9 | Overlay polish + animations | DONE | Fade in/out, mic breathe, status transitions |
| 10 | Packaging | DONE | NSIS installer: `release/VoiceFlow Setup 1.0.0.exe` (86MB) |

## Build Notes
- electron-builder winCodeSign fails without symlink permissions on Windows
- Fix: use `--config.win.signAndEditExecutable=false` to skip code signing
- Installer output: `release/VoiceFlow Setup 1.0.0.exe`
- The `release/` folder is gitignored (too large for repo)

## Website / Distribution
- Landing page: `website/index.html` - dark theme, animated demo, feature cards
- Post-download page: `website/download.html` - 3-step setup + API key instructions
- Download button triggers .exe download then redirects to instructions page
- For production: deploy website/ to Vercel, host .exe on GitHub Releases

## Known Gaps
- **No tests** - No test framework or test files
- **No GitHub Actions** - No CI/CD pipeline for automated builds
- **Escape key always registered** - Works correctly (only acts when recording) but registers globally

## Conventions
- Path alias: `@/` → `src/`
- CSS: Tailwind + CSS variables (HSL) for theming
- Components: Function components with hooks, no class components
- State: React hooks + electron-store (no Redux/Zustand)
- IPC pattern: `ipcMain.handle()` + `ipcRenderer.invoke()` for async, `.on()` + `.send()` for fire-and-forget
- File naming: kebab-case for files, PascalCase for components
