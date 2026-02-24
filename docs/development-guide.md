# VoxGen — Development Guide

## Prerequisites

- **Node.js** — LTS version (v18+ recommended)
- **npm** — Comes with Node.js
- **Windows** — Primary development platform (nut.js text injection, uiohook-napi)
- **Git** — Version control

## Quick Start

```bash
# Clone and install
git clone https://github.com/simchap123/VoxGen.git
cd VoxGen
npm install

# Start development server (Vite + Electron with hot reload)
npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server + Electron with hot reload |
| `npm run build` | Clean + Vite production build → `dist/` + `dist-electron/` |
| `npm run electron:build:win` | Build + create Windows installer → `release/` |
| `npm run clean` | Delete `dist/` and `dist-electron/` directories |
| `npm run preview` | Preview production build in browser |

## Build Process

1. `npm run clean` — removes `dist/` and `dist-electron/`
2. `vite build` — compiles everything:
   - Renderer (React) → `dist/`
   - Main process → `dist-electron/main/`
   - Preload → `dist-electron/preload/` (CJS format)
3. `electron-builder` — packages into NSIS installer → `release/`

**No standalone `tsc`** — Vite handles all TypeScript compilation via vite-plugin-electron.

## Build Installer

```bash
npm run build
npx electron-builder --win --config.win.signAndEditExecutable=false
```

The `--config.win.signAndEditExecutable=false` flag is needed on Windows without symlink privileges.

Output: `release/VoxGen-Setup-{version}.exe`

## Project Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite + electron plugin, path aliases, native module externals |
| `tsconfig.json` | TypeScript config (strict, ES2020, bundler moduleResolution) |
| `tsconfig.node.json` | TypeScript config for Vite/Node files |
| `tailwind.config.ts` | Tailwind v3 + custom theme (sage/cream/charcoal) |
| `postcss.config.js` | PostCSS with Tailwind + autoprefixer |
| `electron-builder.json5` | Installer config, auto-update publish settings |
| `vercel.json` | Vercel deployment: API install command, output directory |
| `components.json` | shadcn/ui component configuration |

## Environment Setup

### Desktop App
No `.env` file needed for local development. API keys are entered through the Settings UI and stored encrypted via Electron safeStorage.

### API Backend (Vercel)
Environment variables are set in the Vercel dashboard:

```
GROQ_API_KEY                    # Server-side Groq key for managed mode
STRIPE_SECRET_KEY               # Stripe API secret
STRIPE_WEBHOOK_SECRET           # Stripe webhook signature verification
STRIPE_PRICE_MONTHLY            # Stripe price ID for monthly plan
STRIPE_PRICE_YEARLY             # Stripe price ID for yearly plan
STRIPE_PRICE_LIFETIME           # Stripe price ID for lifetime plan
SUPABASE_URL                    # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role key (server-only!)
APP_URL                         # App URL for redirects
```

## Coding Conventions

### ESM Throughout
- `"type": "module"` in package.json — **load-bearing, do not remove**
- ESM imports only — no `require()`
- Exception: preload compiles to CJS (`formats: ['cjs']`)

### File Naming
- **Files:** kebab-case (`provider-factory.ts`)
- **Components:** PascalCase (`SettingsPage`)
- **Hooks:** `use` prefix (`useRecordingState`)
- **Types:** PascalCase (`STTProvider`)

### Path Aliases
- `@/` → `./src/` (configured in both `tsconfig.json` and `vite.config.ts`)

### Styling
- Tailwind utilities + `cn()` from `src/lib/cn.ts` (clsx + tailwind-merge)
- Semantic HSL CSS variable tokens — NOT raw palette colors (`bg-green-500`)
- No inline styles (except overlay transparency hack)

### IPC Patterns
- **Async (request/response):** `ipcMain.handle()` + `ipcRenderer.invoke()` → returns Promise
- **Fire-and-forget:** `ipcMain.on()` + `ipcRenderer.send()` → no return value
- New IPC channel requires changes to 3 files:
  1. `electron/main/ipc-handlers.ts` — handler implementation
  2. `electron/preload/index.ts` — bridge exposure
  3. `electron/preload/types.ts` — TypeScript type definition

### Provider Pattern
All STT and Cleanup providers follow: **Interface → Implementation → Factory**
- Factory uses lazy singleton Map cache
- `init(apiKey)` must be called before use
- "managed" type passes user email as "apiKey" (proxied through Vercel)

## Testing

No test framework is currently configured. When adding tests, use **Vitest** (already on Vite, zero config needed).

## Release Process

**3-file sync is CRITICAL — always update all three:**

1. `package.json` — Bump version
2. `src/lib/changelog.ts` — Add changelog entry
3. `website/whats-new.html` — Add changelog entry, move "Latest" badge

```bash
# Build
npm run build
npx electron-builder --win --config.win.signAndEditExecutable=false

# Commit, tag, push
git add -A && git commit -m "vX.Y.Z: [summary]"
git tag vX.Y.Z && git push origin master --tags

# Create GitHub release (auto-update requires all 3 assets)
gh release create vX.Y.Z --title "vX.Y.Z - [Title]" --notes "[notes]" \
  release/VoxGen-Setup-X.Y.Z.exe \
  release/VoxGen-Setup-X.Y.Z.exe.blockmap \
  release/latest.yml
```

## Deployment

### Website + API (Vercel)
- Push to `master` triggers automatic Vercel deployment
- `vercel.json` runs `cd api && npm install` then serves `website/` as static
- **Hobby plan limit:** 12 serverless functions max (currently at 11)
- API functions live in `api/` directory

### Desktop App (GitHub Releases)
- `electron-updater` checks GitHub Releases on startup
- Auto-downloads updates and prompts user to restart
- Requires: `.exe` + `.blockmap` + `latest.yml` uploaded to the release

## Common Pitfalls

See `_bmad-output/project-context.md` for the full list of 47 critical rules. Key ones:

- **Never use `require()`** — ESM project, will break build
- **Never add `tsc` to build scripts** — Vite handles all TS compilation
- **Never use `@nut-tree/nut-js`** — removed from npm, use `@nut-tree-fork/nut-js`
- **Never import `fs`/`path`/`electron` in `src/`** — renderer is a browser, use IPC
- **Never add a 12th API function** — Vercel Hobby plan limit
- **Never change `publish.repo` in electron-builder.json5** — must be `VoxGen`
