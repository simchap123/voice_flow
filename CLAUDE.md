# VoxGen - AI Dictation & Content Generation

System-wide AI dictation and smart content generation: press a global hotkey from any app, speak, and transcribed + AI-cleaned text gets typed into the focused application. Use keyword triggers to generate structured content from voice prompts.

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
npm run build               # clean + vite build → dist/ + dist-electron/
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
- **Free trial:** 30 days, server-side tracking (tied to email, prevents reinstall reset)
- **BYOK:** Free forever with own API key (after trial or with Lifetime license)
- **Pro:** $9/mo, $59/yr via Stripe (managed API keys)
- **Lifetime:** $149 one-time (BYOK — bring own API key)
- **Activation:** Email-based (no license key entry), user enters email used at purchase
- **Backend:** Vercel serverless + Supabase DB + Stripe payments
- **Validation:** /api/validate-license { email }, cached 24h, offline-safe

### Content Generation System
- **Keyword triggers:** Special words (e.g., "generate", "compose", "draft") at the start of a dictation activate content generation mode
- **Generation templates:** Predefined templates for emails, summaries, blog posts, and other structured content
- **Prompt refinement:** Spoken rough ideas are refined by AI into well-structured prompts before generation
- **Smart content generation:** Voice-driven content creation that goes beyond simple dictation

### Environment Variables (Vercel)
```
GROQ_API_KEY                  # Server-side Groq key for managed mode (free trial / Pro users)
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

## Current Version: v2.1.1

### Recent Session (Feb 2026) — What Was Done

#### v1.4.0 Changes
1. **Bug Fix: Hold-to-record stops prematurely** — Removed code in `hotkeys.ts` that cancelled active hold-mode recording when any non-modifier key was pressed. Now only releasing the modifier stops hold-mode recording.
2. **Bug Fix: Copy button in History broken** — Added `clipboard:write` IPC handler using Electron's native `clipboard` module. HistoryCard now uses IPC clipboard with `navigator.clipboard` fallback, wrapped in try/catch.
3. **Bug Fix: History entries disappearing (race condition)** — `useTranscriptionHistory.ts` now listens for `transcription-complete` IPC events to keep React state in sync with overlay recordings, preventing stale state from overwriting new entries on persist.
4. **Bug Fix: Truncated transcription text** — Added expand/collapse toggle to HistoryCard (click text or chevron button to see full content).
5. **Feature: Overlay exit menu** — When recording, overlay expands from 48x48 to 180x48 showing: pulsing mic icon + Stop button (Square) + Cancel button (X). `expandOverlay()`/`shrinkOverlay()` in `windows.ts` handle resizing.
6. **Build fix** — Removed `tsc` from build script (was conflicting with `tsconfig.node.json` composite mode). Added `clean` script that deletes `dist/` and `dist-electron/` before build.

#### v1.4.1 Changes
7. **Bug Fix: Overlay X button doesn't hide overlay** — Cancel button now calls `hideOverlay()` after cancelling + sends `recording-cancelled` IPC to reset main process `isRecording`/`isProcessing` state.
8. **Bug Fix: Stop button doesn't sync main process state** — Stop button now sends `recording-stopped-from-ui` IPC so main process knows to transition from recording to processing.
9. **Bug Fix: Tray icon invisible (white on white)** — Replaced base64 white PNG with actual `resources/icon-16.png` (purple mic). Added `extraResources` in `electron-builder.json5` to bundle icon for production.
10. **Bug Fix: Settings not syncing between windows** — When any setting changes via `settings:set`, main process broadcasts `setting-changed` to all windows. `useSettings` listens for this and updates React state. Fixes code mode toggle being ignored by overlay.
11. **Feature: Click overlay dot to open main window** — Clicking the idle overlay dot sends `show-main-window` IPC to bring up the main window (shortcut to history/settings).

#### v1.5.0 Changes
12. **Feature: Recording Backup** — All recordings auto-saved as .webm files in `userData/recordings/`. History cards have a download button. "Open Recordings Folder" button in History page. Export via system save dialog.
13. **Feature: Overlay Redesign** — Idle overlay is now a toolbar with mic/settings/close icons. Recording state shows a cleaner pill with stop/cancel. Separate processing and error visual states. `expandOverlayIdle()` and `showOverlayIdle()` added to windows.ts.
14. **Feature: Auto-Update via GitHub Releases** — `electron-updater` checks GitHub Releases on startup, auto-downloads updates, and prompts user to restart. "Check for Updates" button in Settings. `publish` config in electron-builder.json5 points to `simchap123/VoxGen`.

### Build Notes
- `npm run build` now runs `clean` + `vite build` (no standalone `tsc` — vite-plugin-electron handles TS compilation)
- `npx electron-builder --win --config.win.signAndEditExecutable=false` needed on Windows without symlink privileges
- Installer: `release/VoxGen Setup {version}.exe`
- Website download URL in `website/index.html` must be updated when version changes

### IPC Channels Added in v1.4.x
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `clipboard:write` | renderer→main (invoke) | Reliable clipboard copy via Electron's native clipboard |
| `overlay:expand` / `overlay:shrink` | renderer→main (send) | Resize overlay window for recording controls |
| `setting-changed` | main→renderer (send) | Broadcast setting changes to all windows |
| `show-main-window` | renderer→main (send) | Open main window from overlay click |
| `recording-stopped-from-ui` | renderer→main (send) | Sync stop state when user clicks Stop in overlay |
| `recording-cancelled` | renderer→main (send) | Reset state when user clicks Cancel in overlay |
| `recording:save` | renderer→main (invoke) | Save recording .webm to userData/recordings/ |
| `recording:open-folder` | renderer→main (invoke) | Open recordings folder in file explorer |
| `recording:export` | renderer→main (invoke) | Export recording via save dialog |
| `update:check` | renderer→main (invoke) | Manually check for updates, returns version info |
| `update:install` | renderer→main (invoke) | Quit and install downloaded update |

### Usage Tracking (v1.6.x)
- Every transcription sends fire-and-forget POST to `/api/track-usage`
- Tracks: word count, audio seconds, STT provider, cleanup provider, language per user
- Supabase `usage_logs` table indexed on `(user_id, created_at DESC)`
- `electron/main/usage-tracker.ts` uses Electron `net` module, non-blocking
- Useful for cost analysis (managed API key users vs BYOK)

### Known Issues / TODO
- GitHub release for v1.4.1 needs manual upload of installer exe
- Code mode should potentially be per-recording-mode (e.g. only for prompt mode) rather than global — user found it annoying when it applied to regular dictation
