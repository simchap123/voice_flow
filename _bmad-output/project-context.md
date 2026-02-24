---
project_name: 'VoxGen'
user_name: 'SimchaPentelnik'
date: '2026-02-23'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 47
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in VoxGen. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core Stack
- **Electron 33.3.1** — Desktop shell (main + preload + renderer processes)
- **React 19.0.0** — Function components + hooks only (no class components)
- **TypeScript 5.7.3** — Strict mode, ES2020 target, bundler moduleResolution
- **Vite 6.0.7** + vite-plugin-electron 0.28.8 — Sole build tool (handles TS compilation)
- **Tailwind CSS 3.4.17** — NOT v4. Uses `tailwind.config.ts` + `postcss.config.js` pattern
- **shadcn/ui (Radix UI)** — HSL CSS variable theming. Sage green + cream brand colors.
- **react-router-dom 7.1.1** — Hash-based routing for overlay detection

### Critical Dependencies
- `openai` 4.77.0 — Used for BOTH OpenAI and Groq APIs (Groq is OpenAI-compatible, just change baseURL)
- `electron-store` 8.2.0 — ESM-only. `"type": "module"` in package.json is load-bearing.
- `@nut-tree-fork/nut-js` 4.2.6 — NOT the original `@nut-tree/nut-js` (removed from npm)
- `uiohook-napi` 1.5.4 — Native addon for global keyboard hooks
- `electron-updater` 6.7.3 — Auto-update from GitHub Releases. publish.repo MUST be `VoxGen`.
- `@huggingface/transformers` 3.8.1 — Local whisper support (partially implemented/experimental)

---

## Critical Implementation Rules

### Language Rules (TypeScript/ESM)
- ESM imports only — no `require()`. `"type": "module"` is load-bearing.
- Path alias: `@/` → `./src/` (tsconfig.json + vite.config.ts)
- Leading semicolons before casts: `;(provider as Type).method()` — intentional ASI avoidance
- No standalone `tsc` in build — Vite handles all TS compilation. Never add `tsc` to scripts.

### Architecture Rules

**Two-Process Boundary:**
- `electron/main/` = Node.js (main process). `src/` = browser (renderer).
- No `fs`/`path`/`electron` in `src/` — must go through IPC via preload.
- `electron/preload/index.ts` is the ONLY bridge (`contextBridge.exposeInMainWorld`).
- Preload compiles to CJS (`formats: ['cjs']`, output `index.cjs`). Everything else is ESM.
- Native modules MUST be in Vite's `rollupOptions.external`.

**Two-Window Architecture:**
- Main window: full UI (frameless). Overlay: transparent, always-on-top, `#/overlay` hash.
- `window.location.hash === '#/overlay'` in App.tsx decides which UI renders.
- Overlay sets `document.documentElement.style.background = 'transparent'` on mount.

**Provider Pattern (STT + Cleanup):**
- Interface → Implementation → Factory (lazy singleton Map cache)
- `init(apiKey)` must be called before use — factory does NOT auto-init from storage
- "managed" type passes user email as "apiKey" (proxied through Vercel API)
- STT types: `'local' | 'groq' | 'openai' | 'deepgram' | 'managed'`
- Cleanup types: `'groq' | 'openai' | 'none' | 'managed'`

**IPC Pattern:**
- Async: `ipcMain.handle()` + `ipcRenderer.invoke()` → returns Promise
- Fire-and-forget: `ipcMain.on()` + `ipcRenderer.send()` → no return
- New IPC channel requires 3 files: `electron/main/ipc-handlers.ts` + `electron/preload/index.ts` + `electron/preload/types.ts`
- Settings changes broadcast to ALL windows via `setting-changed` event

**Navigation (v2.16.3 — from actual UI):**
- Sidebar: History, Dictation, AI Prompt, Settings (4 items)
- Settings tabs: General, Notifications, Account
- Mode settings on own pages (Dictation, AI Prompt) — NOT in Settings

**State Management:**
- React Context for settings (SettingsContext) — wraps electron-store + localStorage fallback
- Local state for everything else (no Redux, no Zustand)
- `useRecordingState` manages: IDLE → RECORDING → PROCESSING_STT → PROCESSING_CLEANUP → INJECTING → IDLE

### Testing Rules
- No test framework configured. When adding: use vitest (already on Vite).

### Code Style

**Naming:**
- Files: kebab-case (`provider-factory.ts`)
- Components: PascalCase (`SettingsPage`)
- Hooks: `use` prefix (`useRecordingState`)
- Types: PascalCase (`STTProvider`)

**Styling:**
- Tailwind utilities + `cn()` from `src/lib/cn.ts` (clsx + tailwind-merge)
- Semantic HSL tokens only — NOT raw palette colors (`bg-green-500`)
- No inline styles (except overlay transparency)

### Workflow Rules

**Git:** Single `master` branch. Commits: `v{version}: {summary}`. Push triggers Vercel deploy.

**Release (CRITICAL — 3-file sync):**
1. `package.json` version
2. `src/lib/changelog.ts` entry
3. `website/whats-new.html` entry
4. Build → electron-builder → git tag → gh release with .exe + .blockmap + latest.yml

**Vercel:** 11 of 12 max API functions (Hobby plan). Do NOT add without checking limit.

### Critical Don't-Miss Rules

**Will break build:**
- `require()` anywhere (ESM project)
- `tsc` standalone (conflicts with composite tsconfig)
- `@nut-tree/nut-js` (removed from npm — use `@nut-tree-fork/nut-js`)
- Missing native module externals in vite.config.ts
- Tailwind v4 syntax (this is v3)

**Will break app:**
- `fs`/`path`/`electron` in `src/` (renderer = browser, no Node.js)
- New IPC without preload bridge
- Not broadcasting setting changes to all windows
- Changing `publish.repo` in electron-builder.json5

**Will break deployment:**
- 12th API function in `api/` (Vercel limit)
- Missing version file updates on release
- `release/` dir uploaded to Vercel (must be in .vercelignore)

**Security:**
- API keys: Electron safeStorage only — never plaintext
- Managed mode: user email passed as "apiKey" to proxy
- SUPABASE_SERVICE_ROLE_KEY: server-side only, never expose to client
- Stripe webhook: always validate signature

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack or patterns change
- Remove rules that become obvious over time

Current Version: v2.16.4
Last Updated: 2026-02-23
