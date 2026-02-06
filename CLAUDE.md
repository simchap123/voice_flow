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
```

## Key Design Decisions
- **Two windows:** Main window (full app, frameless) + Overlay window (transparent, always-on-top, 380x200)
- **Overlay detection:** `window.location.hash === '#/overlay'` in App.tsx
- **Text injection:** Write to clipboard → nut.js simulates Ctrl+V → restore previous clipboard
- **API key security:** Encrypted with Electron safeStorage (DPAPI on Windows), fallback to plaintext
- **Audio:** MediaRecorder API in renderer, sends blob to OpenAI Whisper API
- **AI cleanup:** GPT-4o-mini post-processes transcription (optional, toggled in settings)
- **Snippet expansion:** Custom engine matches trigger words in transcribed text

## Recording Flow
```
IDLE → RECORDING → PROCESSING_STT → PROCESSING_CLEANUP → INJECTING → IDLE
```

## Commands
```bash
npm run dev                 # Vite dev server (no Electron)
npm run electron:dev        # Vite + Electron with hot reload
npm run build               # tsc + vite build → dist/ + dist-electron/
npm run electron:build:win  # Build Windows .exe (NSIS installer) → release/
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
| 9 | Overlay polish + animations | PARTIAL | Shell works, NO animations (no entrance/exit/transitions) |
| 10 | Packaging | NOT BUILT | Config ready, but resources/ is EMPTY (needs icons) |

## Known Gaps
- **No app icons** - `resources/` folder is empty. Needs icon.ico (Windows), icon.png (tray/Linux), icon.icns (Mac)
- **No animations on overlay** - Shows/hides instantly, no fade/slide/scale transitions
- **No git repo** - Not initialized yet
- **No tests** - No test framework or test files
- **Escape key always registered** - Works correctly (only acts when recording) but registers globally
- **Design doc outdated** - References robotjs (replaced by @nut-tree-fork/nut-js)

## Conventions
- Path alias: `@/` → `src/`
- CSS: Tailwind + CSS variables (HSL) for theming
- Components: Function components with hooks, no class components
- State: React hooks + electron-store (no Redux/Zustand)
- IPC pattern: `ipcMain.handle()` + `ipcRenderer.invoke()` for async, `.on()` + `.send()` for fire-and-forget
- File naming: kebab-case for files, PascalCase for components
