# VoxGen — Source Tree Analysis

## Top-Level Structure

```
VoxGen/
├── electron/                  # Main process + preload (Node.js)
│   ├── main/                  # Main process modules
│   │   ├── index.ts           # Entry point — app lifecycle, window creation
│   │   ├── ipc-handlers.ts    # All IPC channel handlers (~40+ channels)
│   │   ├── windows.ts         # Window management (main + overlay)
│   │   ├── hotkeys.ts         # Global hotkey registration (uiohook-napi)
│   │   ├── store.ts           # electron-store wrapper (encrypted settings)
│   │   ├── text-injection.ts  # Clipboard + paste via nut.js
│   │   ├── tray.ts            # System tray icon + menu
│   │   ├── license.ts         # License validation + caching
│   │   ├── updater.ts         # Auto-update via electron-updater
│   │   ├── usage-tracker.ts   # Fire-and-forget usage analytics
│   │   └── event-tracker.ts   # Event tracking utilities
│   └── preload/               # Preload scripts (CJS output)
│       ├── index.ts           # contextBridge — sole IPC bridge
│       └── types.ts           # ElectronAPI type definitions
│
├── src/                       # Renderer process (React/Browser)
│   ├── App.tsx                # Root — routes main window vs overlay via hash
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles + Tailwind directives
│   ├── pages/                 # Route-level page components
│   │   ├── HistoryPage.tsx    # Transcription history list
│   │   ├── DictationPage.tsx  # Dictation recording UI (unused?)
│   │   ├── DictationModePage.tsx   # Dictation mode settings
│   │   ├── AIPromptModePage.tsx    # AI Prompt mode settings + templates
│   │   ├── SettingsPage.tsx   # Settings (General, Notifications, Account tabs)
│   │   ├── SnippetsPage.tsx   # Text snippets management
│   │   ├── WhatsNewPage.tsx   # In-app changelog viewer
│   │   └── ThreeStepsPage.tsx # Onboarding "3 steps" tutorial
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # shadcn/ui primitives (button, input, select, etc.)
│   │   ├── layout/            # App shell components
│   │   │   ├── Sidebar.tsx    # 4-item sidebar: History, Dictation, AI Prompt, Settings
│   │   │   ├── TitleBar.tsx   # Custom frameless window title bar
│   │   │   └── OverlayShell.tsx  # Overlay window shell (transparent)
│   │   ├── settings/          # Settings-related components
│   │   │   ├── AccountSection.tsx      # Account/license management
│   │   │   ├── RecordingSection.tsx    # Recording settings (hotkey, mic, mode)
│   │   │   ├── AIProcessingSection.tsx # STT + cleanup provider config
│   │   │   ├── ProvidersSection.tsx    # Provider selection UI
│   │   │   ├── ProviderApiKeyInput.tsx # Encrypted API key input
│   │   │   ├── EnhancementSection.tsx  # Text enhancement settings
│   │   │   ├── PromptsSection.tsx      # Custom prompt management
│   │   │   ├── PowerModesSection.tsx   # Power mode configuration
│   │   │   ├── HotkeyRecorder.tsx      # Hotkey capture widget
│   │   │   ├── LocalModelManager.tsx   # Local whisper model download UI
│   │   │   ├── LicenseInput.tsx        # License activation (email-based)
│   │   │   ├── plan-picker.tsx         # Subscription plan selector
│   │   │   ├── MicrophoneSelect.tsx    # Microphone device picker
│   │   │   ├── LanguageSelect.tsx      # Language selection dropdown
│   │   │   ├── ThemeToggle.tsx         # Dark/light mode toggle
│   │   │   ├── EmailReminder.tsx       # Email setup reminder
│   │   │   ├── SettingsNav.tsx         # Settings tab navigation
│   │   │   ├── AboutSection.tsx        # App version + links
│   │   │   └── ApiKeyInput.tsx         # Generic API key input
│   │   ├── history/           # History page components
│   │   │   ├── HistoryCard.tsx     # Individual transcription card
│   │   │   ├── HistoryList.tsx     # Transcription list container
│   │   │   └── SearchBar.tsx       # History search/filter
│   │   ├── dictation/         # Dictation UI components
│   │   │   ├── MicButton.tsx           # Microphone record button
│   │   │   ├── StatusIndicator.tsx     # Recording status display
│   │   │   ├── WaveformVisualizer.tsx  # Audio waveform animation
│   │   │   └── TranscriptionPreview.tsx # Live transcription display
│   │   ├── snippets/          # Snippet management components
│   │   │   ├── SnippetEditor.tsx   # Snippet create/edit form
│   │   │   ├── SnippetsList.tsx    # Snippet list view
│   │   │   └── ImportExport.tsx    # Snippet import/export
│   │   └── onboarding/
│   │       └── WelcomeModal.tsx    # First-run onboarding wizard
│   ├── hooks/                 # Custom React hooks
│   │   ├── useSettings.ts          # SettingsContext — wraps electron-store
│   │   ├── useRecordingState.ts    # Central recording state machine
│   │   ├── useAudioRecorder.ts     # MediaRecorder API wrapper
│   │   ├── useWhisperTranscription.ts  # STT transcription orchestrator
│   │   ├── useGptCleanup.ts        # Cleanup provider orchestrator
│   │   ├── useTranscriptionHistory.ts  # History persistence
│   │   ├── useCustomPrompts.ts     # Custom prompt CRUD
│   │   ├── useSnippets.ts          # Snippet management
│   │   ├── useElectronBridge.ts    # IPC bridge hook
│   │   ├── useModelDownload.ts     # Local model download tracking
│   │   ├── useToast.ts             # Toast notification hook
│   │   └── useWaveform.ts          # Audio visualization data
│   ├── lib/                   # Core libraries and utilities
│   │   ├── cn.ts              # clsx + tailwind-merge utility
│   │   ├── openai.ts          # OpenAI client setup
│   │   ├── audio-utils.ts     # Audio format conversion utilities
│   │   ├── snippet-engine.ts  # Snippet expansion engine
│   │   ├── changelog.ts       # In-app changelog data
│   │   ├── stt/               # Speech-to-text providers
│   │   │   ├── types.ts           # STTProvider interface + types
│   │   │   ├── provider-factory.ts # Lazy singleton factory
│   │   │   ├── openai-whisper.ts   # OpenAI Whisper implementation
│   │   │   ├── groq-whisper.ts     # Groq Whisper implementation
│   │   │   ├── managed-stt.ts      # Managed mode (Vercel proxy)
│   │   │   └── local-whisper.ts    # Local whisper (experimental)
│   │   ├── cleanup/           # Text cleanup providers
│   │   │   ├── types.ts           # CleanupProvider interface + types
│   │   │   ├── provider-factory.ts # Lazy singleton factory
│   │   │   ├── openai-cleanup.ts   # OpenAI GPT cleanup
│   │   │   ├── groq-cleanup.ts     # Groq Llama cleanup
│   │   │   ├── managed-cleanup.ts  # Managed mode (Vercel proxy)
│   │   │   ├── pipeline.ts         # Cleanup pipeline orchestrator
│   │   │   ├── system-prompts.ts   # AI system prompts (dictation + code)
│   │   │   ├── generation-templates.ts  # Content generation templates
│   │   │   ├── predefined-prompts.ts    # Built-in AI prompts
│   │   │   ├── keyword-detector.ts # Generation keyword triggers
│   │   │   ├── transcript-filter.ts # Input sanitization
│   │   │   ├── output-filter.ts    # Output sanitization
│   │   │   └── text-formatter.ts   # Post-processing formatting
│   │   └── power-modes/
│   │       └── matcher.ts     # Power mode pattern matching
│   └── types/                 # TypeScript type definitions
│       ├── settings.ts        # App settings types
│       ├── transcription.ts   # Transcription data types
│       ├── snippets.ts        # Snippet types
│       ├── custom-prompt.ts   # Custom prompt types
│       ├── power-mode.ts      # Power mode types
│       └── electron.d.ts      # ElectronAPI global type declaration
│
├── api/                       # Vercel serverless functions (11/12 limit)
│   ├── checkout.ts            # Stripe checkout session creation
│   ├── customer-portal.ts     # Stripe customer portal redirect
│   ├── get-license.ts         # License lookup by email
│   ├── validate-license.ts    # License validation endpoint
│   ├── proxy-stt.ts           # Managed mode STT proxy
│   ├── proxy-cleanup.ts       # Managed mode cleanup proxy
│   ├── track-usage.ts         # Usage analytics (fire-and-forget)
│   ├── webhooks/
│   │   └── stripe.ts          # Stripe webhook handler
│   ├── lib/                   # Shared API utilities
│   │   ├── supabase.ts        # Supabase client init
│   │   ├── validate-email.ts  # Email validation helper
│   │   └── validate-user.ts   # User validation helper
│   ├── package.json           # API-specific dependencies
│   └── tsconfig.json          # API TypeScript config
│
├── website/                   # Static marketing site (served by Vercel)
│   ├── index.html             # Landing page
│   ├── download.html          # Download page with installer link
│   ├── whats-new.html         # Public changelog
│   ├── walkthrough.html       # Feature walkthrough
│   ├── account.html           # Account management page
│   ├── success.html           # Post-purchase success page
│   └── verified.html          # Email verification page
│
├── resources/                 # Build resources (icons, etc.)
├── public/                    # Static assets for renderer
├── scripts/                   # Build/utility scripts
├── build/                     # Electron-builder resources
├── docs/                      # Project documentation (you are here)
├── _bmad/                     # BMAD agent system
├── _bmad-output/              # BMAD workflow outputs
│
├── package.json               # Root dependencies + scripts
├── vite.config.ts             # Vite + electron plugin config
├── tsconfig.json              # Main TypeScript config
├── tsconfig.node.json         # Node/Vite TypeScript config
├── tailwind.config.ts         # Tailwind v3 configuration
├── postcss.config.js          # PostCSS config
├── electron-builder.json5     # Electron Builder config (NSIS installer)
├── vercel.json                # Vercel deployment config
├── components.json            # shadcn/ui configuration
├── index.html                 # Vite HTML entry point
└── CLAUDE.md                  # AI agent instructions
```

## Critical Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| Electron Main | `electron/main/index.ts` | App lifecycle, window creation |
| React Renderer | `src/main.tsx` → `src/App.tsx` | UI entry, hash-based routing |
| Preload Bridge | `electron/preload/index.ts` | IPC channel definitions |
| Vite Build | `vite.config.ts` | Build orchestration for all processes |
| API Functions | `api/*.ts` | Individual serverless endpoints |

## Integration Points

| From | To | Mechanism | Purpose |
|------|----|-----------|---------|
| Renderer ↔ Main | IPC | `ipcMain.handle` / `ipcRenderer.invoke` | All cross-process communication |
| Desktop → API | HTTPS | `fetch()` / `net.request()` | License validation, managed mode proxies, usage tracking |
| API → Supabase | PostgreSQL | `@supabase/supabase-js` | User data, licenses, usage logs |
| API → Stripe | REST | `stripe` SDK | Payments, subscriptions, webhooks |
| Website → API | HTTPS | `fetch()` | Checkout, account management |
