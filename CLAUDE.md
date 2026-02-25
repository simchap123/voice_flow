# VoxGen - AI Dictation & Content Generation

System-wide AI dictation and smart content generation: press a global hotkey from any app, speak, and transcribed + AI-cleaned text gets typed into the focused application. Use keyword triggers to generate structured content from voice prompts.

**Stack:** Electron 33 + React 19 + Vite 6 + TypeScript 5.7 + Tailwind 3.4 + shadcn/ui (Radix)

## Documentation

- `_bmad-output/project-context.md` — Critical rules for AI agents (47 rules, read this first)
- `docs/ARCHITECTURE.md` — Code structure, provider system, recording flow, IPC
- `docs/BACKEND_ARCHITECTURE.md` — Supabase + Stripe + Vercel API, DB schema, purchase flow
- `docs/USER_JOURNEY.md` — User flows, state machine, settings, trial/license
- `docs/PRD-v3.md` — Product requirements, pricing, phases, technical decisions

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

STT:     OpenAI Whisper | Groq Whisper | Deepgram | Managed (proxy) | Local (experimental)
Cleanup: OpenAI GPT-4o-mini | Groq Llama 3.3 | Managed (proxy) | None (disabled)
```

### Key Design Decisions
- **Two windows:** Main window (frameless) + Overlay window (transparent, always-on-top)
- **Overlay detection:** `window.location.hash === '#/overlay'` in App.tsx
- **Text injection:** Clipboard + Ctrl+V (Win/Linux) or Cmd+V (macOS) via nut.js
- **API key security:** Encrypted per-provider with Electron safeStorage
- **ESM:** `"type": "module"` in package.json (load-bearing — do not remove)
- **Audio:** MediaRecorder API, WebM/Opus format
- **Navigation:** Sidebar has 4 items: History, Dictation, AI Prompt, Settings
- **Settings:** 3 tabs: General, Notifications, Account
- **Mode settings:** On their own pages (Dictation, AI Prompt) — NOT in Settings

### Licensing
- **Free trial:** 30 days, server-side tracking (tied to email, prevents reinstall reset)
- **BYOK:** Free forever with own API key (after trial or with Lifetime license)
- **Pro:** $9/mo, $59/yr via Stripe (managed API keys)
- **Lifetime:** $149 one-time (BYOK — bring own API key)
- **Activation:** Email-based, user enters email used at purchase
- **Backend:** Vercel serverless + Supabase DB + Stripe payments
- **Validation:** /api/validate-license { email }, cached 24h, offline-safe

### Content Generation System
- **Keyword triggers:** Special words (e.g., "generate", "compose", "draft") activate content generation mode
- **Generation templates:** Predefined templates for emails, summaries, blog posts, etc.
- **Prompt refinement:** Spoken rough ideas refined by AI into structured prompts before generation

### Environment Variables (Vercel)
```
GROQ_API_KEY                  # Server-side Groq key for managed mode
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY, STRIPE_PRICE_LIFETIME
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
APP_URL
```

## Conventions
- Path alias: `@/` → `src/`
- CSS: Tailwind + CSS variables (HSL) for theming. Sage green + cream brand colors.
- Components: Function components with hooks, no class components
- State: React hooks + electron-store (no Redux/Zustand)
- IPC: `ipcMain.handle()` + `ipcRenderer.invoke()` for async, `.on()` + `.send()` for fire-and-forget
- File naming: kebab-case for files, PascalCase for components
- Provider pattern: Interface → Implementation → Factory (lazy singleton Map cache)

### Release Process (CRITICAL — 3-file sync)
**ALWAYS update ALL THREE when releasing a new version:**
1. **package.json** — Bump version number
2. **src/lib/changelog.ts** — Add new entry at the top
3. **website/whats-new.html** — Add new changelog entry, move "Latest" badge

**Full release workflow:**
```bash
# 1. Update version in package.json
# 2. Add changelog entry to src/lib/changelog.ts
# 3. Add changelog entry to website/whats-new.html
# 4. Build and package
npm run build
npx electron-builder --win --config.win.signAndEditExecutable=false
# 5. Commit, tag, and push
git add -A
git commit -m "vX.Y.Z: [summary]"
git tag vX.Y.Z
git push origin master --tags
# 6. Create GitHub release with installer assets
gh release create vX.Y.Z --title "vX.Y.Z - [Title]" --notes "[Release notes]" \
  release/VoxGen-Setup-X.Y.Z.exe \
  release/VoxGen-Setup-X.Y.Z.exe.blockmap \
  release/latest.yml
```

### Dependencies (critical)
- `@nut-tree-fork/nut-js` (NOT the original nut-tree/nut-js — removed from npm)
- `electron-store` v8 (ESM-only, requires `"type": "module"`)
- `openai` v4 (used for both OpenAI and Groq — Groq is OpenAI-compatible)
- `uiohook-napi` for global keyboard hooks
- `@huggingface/transformers` for local whisper (experimental)

## Current Version: v2.16.6
