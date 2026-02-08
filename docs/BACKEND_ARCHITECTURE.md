# VoiceFlow Backend Architecture

## Overview

The backend enables monetization via license-key-based payments. No user registration or passwords needed — users purchase a license through Stripe, receive a key, and enter it in the desktop app. A 7-day free trial is built into the app locally.

## Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Database | Supabase Postgres | Row-level security, auto-generated license keys, managed |
| Billing | Stripe | Checkout hosted pages, webhooks, subscriptions + one-time |
| API | Vercel Serverless Functions | Auto-scaling, zero config, co-located with website |
| Hosting | Vercel (website + API) | Static website + serverless functions in one deploy |
| Desktop | Electron (license validation) | Uses `net` module to call Vercel API |

## Database Schema (Supabase)

**Project ID:** `xsdngjfnsszulezxvsjd`

### Tables

```sql
-- users: minimal user record keyed by email
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- products: the VoiceFlow product
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,        -- 'voiceflow'
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- license_types: pricing tiers
CREATE TABLE license_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  slug TEXT NOT NULL,               -- 'free', 'pro_monthly', 'pro_yearly', 'lifetime'
  name TEXT NOT NULL,
  price_cents INTEGER DEFAULT 0,    -- 0, 800, 4800, 3900
  duration_days INTEGER,            -- 30, 365, NULL (lifetime)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_licenses: issued licenses
CREATE TABLE user_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  license_type_id UUID REFERENCES license_types(id),
  license_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','cancelled','suspended')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_user_licenses_license_key ON user_licenses (license_key);
CREATE INDEX idx_user_licenses_stripe_subscription_id ON user_licenses (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_user_licenses_user_id_created ON user_licenses (user_id, created_at DESC);
```

### Seeded Data

| License Type | Slug | Price | Duration |
|-------------|------|-------|----------|
| Free (BYOK) | `free` | $0 | Forever |
| Pro Monthly | `pro_monthly` | $8/mo | 30 days |
| Pro Yearly | `pro_yearly` | $48/yr | 365 days |
| Lifetime | `lifetime` | $39 | Forever |

## API Endpoints (Vercel Serverless)

All endpoints live in `api/` directory, auto-deployed by Vercel.

### POST /api/checkout
Creates a Stripe Checkout session.

**Request:** `{ plan: 'monthly' | 'yearly' | 'lifetime', email: string }`
**Response:** `{ url: string }` (Stripe checkout URL)

- Uses `stripe.checkout.sessions.create()`
- Mode: `subscription` for monthly/yearly, `payment` for lifetime
- Includes plan in session metadata for webhook processing

### POST /api/webhooks/stripe
Handles Stripe webhook events with signature verification.

**Events handled:**
- `checkout.session.completed` → Upserts user, looks up license type, creates license with auto-generated key
- `customer.subscription.deleted` → Sets license status to `cancelled`

**Raw body parsing** required (bodyParser disabled) for Stripe signature verification.

### POST /api/validate-license
Validates a license key.

**Request:** `{ licenseKey: string }`
**Response:** `{ valid: boolean, plan?: string, planSlug?: string, expiresAt?: string, error?: string }`

- Joins `user_licenses` with `license_types`
- Checks: status = active, not expired (lifetime keys never expire)

### GET /api/get-license
Retrieves license key after Stripe payment.

**Query:** `?session_id=cs_...`
**Response:** `{ licenseKey: string, plan: string, planSlug: string, expiresAt: string | null }`

- Looks up Stripe session to get customer email
- Finds most recent license for that user

## Purchase Flow

```
1. User visits website → Clicks pricing card → Enters email in modal
2. POST /api/checkout → Returns Stripe Checkout URL → Redirect
3. User pays on Stripe's hosted page
4. Stripe fires webhook → POST /api/webhooks/stripe
   → Upserts user in Supabase
   → Creates license with auto-generated 48-char hex key
5. Stripe redirects to /success.html?session_id=cs_...
   → Page calls GET /api/get-license?session_id=cs_...
   → Shows license key with copy button + activation instructions
6. User opens VoiceFlow → Settings → Pastes license key → Activate
   → App calls POST /api/validate-license → Returns valid + plan
   → Cached locally in electron-store for 24h
```

## Desktop App Integration

### Trial System
- 7-day free trial, no registration
- `trialStartedAt` set in electron-store on first launch
- `canUseApp()` returns true if trial active OR license valid
- Trial progress bar shown in Settings

### License Validation (electron/main/license.ts)
```
validateLicenseKey(key) → calls /api/validate-license → caches result
checkLicenseOnStartup() → revalidates if >24h since last check
canUseApp() → true if license active OR trial not expired
```

### Offline Handling
- If network unavailable, uses cached validation result
- Cached license status stored in electron-store
- Grace period: keeps working with last known valid status

### Recording Gate (hotkeys.ts)
- `handleHotkeyAction()` checks `canUseApp()` before starting recording
- If blocked: shows overlay with lock icon for 2s, then hides

### IPC Bridge
```
license:validate  → validates key via API, stores result
license:get-info  → returns cached license info
license:clear     → removes stored license
trial-expired     → event sent to overlay when recording blocked
```

## Stripe Configuration (Manual Steps)

1. Create Stripe account
2. Create 3 products/prices:
   - VoiceFlow Pro Monthly: $8/month recurring
   - VoiceFlow Pro Yearly: $48/year recurring
   - VoiceFlow Lifetime: $39 one-time
3. Set up webhook: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy Price IDs and webhook secret to Vercel env vars

## Environment Variables (Vercel Dashboard)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_PRICE_LIFETIME=price_...
SUPABASE_URL=https://xsdngjfnsszulezxvsjd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
APP_URL=https://your-domain.vercel.app
```

## Cost Analysis

### Per-Transaction Costs
| Plan | Revenue | Stripe Fee (2.9% + $0.30) | Net |
|------|---------|---------------------------|-----|
| Monthly | $8/mo | ~$0.53 | $7.47/mo |
| Yearly | $48/yr | ~$1.69 | $46.31/yr ($3.86/mo) |
| Lifetime | $39 | ~$1.43 | $37.57 once |

### Infrastructure Costs
| Service | Cost | Notes |
|---------|------|-------|
| Supabase | $0/mo | Free tier: 500MB DB, 50K MAU |
| Vercel | $0/mo | Free tier: 100GB bandwidth, serverless |
| Stripe | Per-transaction only | No monthly fee |

## Security

- All API calls over HTTPS
- Stripe webhook signature verification
- Supabase service_role key only used server-side (Vercel env vars)
- License keys are 48-char random hex (auto-generated by Postgres)
- No passwords stored — license-key-only authentication
- RLS enabled on all tables (service_role bypasses for API)
