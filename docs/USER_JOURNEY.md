# VoiceFlow — User Journey

## Download & Install

1. Visit website → Read features → Click "Download for Windows"
2. Run `VoiceFlow Setup.exe` → Windows SmartScreen → "Run anyway"
3. App installs, launches, appears in system tray

## First-Time Setup

1. Open main window from tray → Go to Settings
2. Choose STT provider: Groq (cheap) or OpenAI
3. Paste API key → Validated → Encrypted with DPAPI/safeStorage
4. Configure hotkey (default: Alt+Space), choose hold or toggle mode
5. Select language, toggle AI cleanup on/off
6. Ready to dictate

## Core Dictation Flow

```
User working in ANY app
  → Press hotkey (Alt+Space)
  → Overlay appears, mic activates
  → Speak (waveform visualization)
  → Release hotkey (or press again in toggle mode)
  → Processing: Audio → Whisper STT → AI cleanup (optional) → Snippet expansion
  → Text injected via Ctrl+V into focused app
  → Overlay hides, result saved to history
  → Back to working
```

## Cancel Flow

Press Escape during recording → Recording cancelled → Overlay hides → Back to app

## Recording State Machine

```
[*] → IDLE
IDLE → RECORDING              (hotkey press)
RECORDING → PROCESSING_STT    (hotkey release / stop)
RECORDING → CANCELLED         (Escape)
PROCESSING_STT → PROCESSING_CLEANUP  (if cleanup enabled)
PROCESSING_STT → INJECTING          (if no cleanup)
PROCESSING_CLEANUP → INJECTING
INJECTING → IDLE              (text pasted)
CANCELLED → IDLE              (reset)
```

## Settings Management

| Setting | Behavior |
|---------|----------|
| API Key | Validates with provider API, encrypted with safeStorage |
| Hotkey | Captures combo, registers with global shortcut system |
| Language | 99+ languages supported by Whisper |
| AI Cleanup | Toggle GPT/Llama post-processing on/off |
| Auto-paste | Toggle text injection on/off |
| Theme | Dark / Light mode |

## Purchase Flow (Pro)

1. Website pricing card → Enter email → POST /api/checkout
2. Stripe Checkout hosted page → User pays
3. Webhook → Creates license key in Supabase
4. Redirect to success.html → Shows license key + copy button
5. User pastes key in Settings → Validated via /api/validate-license
6. License cached locally for 24h, revalidated on startup

## Trial System

- 7-day free trial from first launch, no registration
- `canUseApp()` checks: trial active OR valid license
- If blocked: overlay shows lock icon for 2s
- BYOK users (own API key) are free forever — no license needed
