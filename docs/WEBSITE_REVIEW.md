# VoxGen Website & App Flow Review

**Date:** 2026-02-10
**Status:** Action items pending

---

## Table of Contents
- [Website Review](#website-review)
- [Full User Flow](#full-user-flow)
- [Tracking & Analytics](#tracking--analytics)
- [Priority Fixes](#priority-fixes)
- [API Issues](#api-issues)

---

## Website Review

### Landing Page (index.html)

**Status:** Mostly functional

- Hero section, features grid, pricing (3 tiers), and email capture all work
- GitHub API resolves latest .exe URL dynamically
- Typewriter demo animation and scroll reveals are smooth
- Two flows: "Download Free" (lead capture → direct download) and "Go Pro" (Stripe checkout)

**Issues:**
| # | Issue | Severity |
|---|-------|----------|
| W1 | GitHub API fallback points to releases web page, not direct .exe | Medium |
| W2 | Checkout button doesn't re-enable after Stripe API error — user stuck | Medium |
| W3 | Email validation weak everywhere (`includes('@')` only) | Low |
| W4 | Modal email input flow unclear when arriving from nav "Get Pro" button | Low |

### Download Page (download.html)

**Status:** Clean (recently revamped)

- Email gate works (if no `?email=` param, shows input)
- Auto-triggers download when arriving with email param
- 3-step setup instructions: open installer, run installer, start dictating
- "Not working? Try again." retry link

**Issues:**
| # | Issue | Severity |
|---|-------|----------|
| D1 | Lead capture path `'free-download-page'` vs `'free'` on index.html — inconsistent tracking | Low |
| D2 | No download confirmation feedback (says "started" but can't verify) | Low |

### Success Page (success.html)

**Status:** Has a critical bug

- Polls `/api/get-license?session_id=...` up to 10 times with 2s delays
- Shows license key and activation instructions after purchase
- Has clipboard copy button

**Issues:**
| # | Issue | Severity |
|---|-------|----------|
| S1 | `success.html` displays `data.licenseKey` but `get-license.ts` never returns it — shows `undefined` | **Critical** |
| S2 | No retry button after polling timeout (10 attempts) — user stuck | High |
| S3 | Back link is `href="/"` — breaks if deployed at a subpath | Medium |
| S4 | Session ID visible in URL — could leak license if URL shared | Medium |

### Walkthrough Page (walkthrough.html)

**Status:** Functional

- 3 animated steps with CSS-only animations
- All nav links point correctly back to index.html sections

**Issues:**
| # | Issue | Severity |
|---|-------|----------|
| T1 | Animations loop infinitely (unnecessary CPU usage) | Low |
| T2 | Version hardcoded as `1.8.0` in filename example | Low |

---

## Full User Flow

### Web → Download → Install

```
Landing Page (index.html)
  │
  ├─ "Download Free" button
  │   ├─ Email captured → POST /api/capture-lead { email, path: 'free' }
  │   ├─ .exe download triggered via GitHub API
  │   └─ Redirect to download.html?email=...
  │       └─ 3-step setup instructions shown
  │
  └─ "Go Pro" button
      ├─ Email captured → POST /api/capture-lead { email, path: 'pro' }
      ├─ POST /api/checkout { plan, email } → Stripe session
      └─ Redirect to Stripe Checkout
          └─ On success → success.html?session_id=...
              └─ Shows license key + activation instructions
```

### First App Launch

```
App starts
  ├─ Mic permission auto-granted
  ├─ electron-store initialized (voxgen-settings.json)
  ├─ trialStartedAt = Date.now() (30-day trial begins)
  ├─ Main window opens → Dictation page (default)
  │   └─ Shows "Set your API key in Settings to begin"
  ├─ Overlay window created → always visible (thin bar)
  ├─ Tray icon created
  ├─ Global hotkeys registered
  ├─ checkLicenseOnStartup() — non-blocking
  └─ initAutoUpdater() — non-blocking
```

**No onboarding wizard or email collection at first launch.**

### License Activation Flow

```
User purchases via Stripe
  └─ Webhook: POST /api/webhooks/stripe
      ├─ Upserts user in Supabase
      └─ Creates user_license record

User opens VoxGen → Settings → Account
  ├─ Enters email used at purchase
  ├─ Clicks "Activate"
  ├─ App: POST /api/validate-license { email }
  ├─ Backend confirms active license
  └─ LicenseInput shows "Active — Pro Monthly — Expires: ..."
```

### Recording Flow

```
User holds Alt (or configured hotkey)
  ├─ Overlay shows recording controls
  ├─ MediaRecorder captures audio (WebM/Opus)
  │
User releases Alt
  ├─ Audio sent to STT provider (OpenAI/Groq/Local)
  ├─ Raw text → cleanup provider (if enabled)
  ├─ Cleaned text injected via clipboard + Ctrl+V
  ├─ Transcription saved to history
  └─ POST /api/track-usage { email, words, duration, provider, language }
      └─ Fire-and-forget (non-blocking)
```

---

## Tracking & Analytics

### What IS Tracked

| Data | When | Where Stored |
|------|------|-------------|
| Email (lead capture) | Website download/checkout | Supabase `leads` table |
| Usage per transcription | Each recording (if email set) | Supabase `usage_logs` |
| License status | On activation + every 24h cache | Supabase `user_licenses` + local |
| Trial start date | First email validation server-side | Supabase `users.trial_started_at` |

### Available Analytics Queries

```sql
-- Usage per user
SELECT COUNT(*), SUM(words), SUM(audio_seconds)
FROM usage_logs WHERE user_id = ? GROUP BY stt_provider;

-- Popular providers
SELECT stt_provider, COUNT(*) FROM usage_logs GROUP BY stt_provider;

-- Trial → Paid conversion
-- Compare users.trial_started_at with user_licenses.created_at

-- Active license count
SELECT COUNT(*) FROM user_licenses WHERE status = 'active';

-- Language preferences
SELECT language, COUNT(*) FROM usage_logs GROUP BY language;
```

### What is NOT Tracked (Gaps)

| Gap | Impact |
|-----|--------|
| No download-to-install tracking | Can't measure install conversion rate |
| No first-launch event | Don't know when someone opens app first time |
| No device ID / fingerprint | Trial can be reset by deleting local config file |
| No anonymous usage tracking | If user never enters email, all usage data is lost |
| No feature telemetry | No data on settings changes, snippets, errors, page visits |
| No funnel analytics | Can't measure download → install → first recording → paid |
| No crash/error reporting | Errors are console.log only, not sent to server |
| No session tracking | Don't know daily/weekly active users |

---

## Priority Fixes

### Critical

- [x] **S1:** Fix `get-license.ts` to return `licenseKey` field — success.html currently shows `undefined` after purchase

### High

- [x] **S2:** Add retry button on success.html after polling timeout + rewrote to email-based activation flow
- [x] **W2:** Re-enable checkout buttons after Stripe API error on index.html
- [x] **API1:** Add webhook idempotency — duplicate Stripe events create duplicate licenses

### Medium

- [x] **S3:** Fix success.html back link (`href="/"` → `href="index.html"`)
- [ ] **S4:** Consider one-time-use or time-limited session IDs for get-license
- [x] **W1:** Use direct .exe URL as GitHub API fallback; open releases page in new tab if API fails (instead of saving HTML as .exe)
- [x] **W3:** Add proper email validation (regex) via shared `api/lib/validate-email.ts` across all API endpoints
- [x] **D1:** Standardize lead capture path values with whitelist (`'free'`, `'pro'`, `'free-download-page'`)
- [x] **API2:** Fix APP_URL trailing slash in checkout.ts

### Low

- [x] **T1:** Pause walkthrough animations when not in viewport (IntersectionObserver + `.paused` class)
- [x] **T2:** Dynamically fetch version from GitHub API for walkthrough filename
- [x] **D2:** Download confirmation feedback (existing green "Your download has started" badge is sufficient)

### Future Enhancements (Tracking)

- [x] Add app-launch tracking event (first launch + subsequent) — `event-tracker.ts` + `trackAppLaunch()`
- [x] Add device ID generation for anonymous trial tracking — `crypto.randomUUID()` in electron-store
- [x] Add feature usage telemetry — `trackFeatureUsed()` helper ready, wire up as needed
- [x] Add error/crash reporting to server — `setupErrorReporting()` catches uncaughtException + unhandledRejection
- [ ] Build conversion funnel dashboard (future — query events + usage_logs + leads tables)

---

## API Issues

### capture-lead.ts
- No duplicate handling (same email inserted multiple times)
- No rate limiting
- Weak email validation

### checkout.ts
- Success URL concatenation could break (`APP_URL` + `/success.html`)
- Missing email validation
- No idempotency key for Stripe session creation
- Buttons not re-enabled on error (frontend issue)

### validate-license.ts
- Race condition on simultaneous user creation
- Trial days calculation has off-by-one (Math.ceil)
- Legacy license key path returns incomplete data
- No response caching headers

### get-license.ts
- **Does NOT return `licenseKey`** — critical mismatch with success.html
- No auth on endpoint — session ID enumeration possible
- No timeout/retry UX after polling fails

### track-usage.ts
- No provider name validation (accepts any string)
- No rate limiting
- Skips entirely if no email (silent data loss)

### webhooks/stripe.ts
- No idempotency — duplicate webhooks create duplicate licenses
- Plan mapping hardcoded (fragile)
- Duration days hardcoded (30/365)
- License type lookup fails silently if slug missing

---

## Data Flow Diagram

```
┌─────────────────────┐
│   Website           │
│   (index.html)      │
│                     │
│  Email → Lead       │──── POST /api/capture-lead ──────┐
│  Checkout → Stripe  │──── POST /api/checkout ──────────┤
└─────────────────────┘                                   │
                                                          ▼
┌─────────────────────┐     ┌──────────────────────┐   ┌──────────────┐
│   VoxGen Desktop    │     │  Vercel Serverless   │   │   Supabase   │
│   (Electron)        │     │  API                 │   │   Postgres   │
│                     │     │                      │   │              │
│  Validate license ──│────>│  /api/validate-license│──>│  users       │
│  Track usage ───────│────>│  /api/track-usage    │──>│  usage_logs  │
│                     │     │  /api/get-license    │──>│  user_licenses│
│  Local store:       │     │  /api/webhooks/stripe│──>│  license_types│
│  - settings         │     │  /api/capture-lead   │──>│  leads       │
│  - history          │     │  /api/checkout       │   │              │
│  - API keys (enc)   │     └──────────────────────┘   └──────────────┘
│  - trial timestamp  │                                       │
└─────────────────────┘                                       │
         │                  ┌──────────────────────┐          │
         │                  │   Stripe             │          │
         │                  │   - Payments         │──────────┘
         │                  │   - Subscriptions    │  (via webhook)
         └──────────────────│   - Customer data    │
           (checkout flow)  └──────────────────────┘
```
