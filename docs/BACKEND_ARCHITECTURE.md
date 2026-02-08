# VoiceFlow Backend Architecture

## Overview

The backend enables monetization (Pro tier) and managed cloud transcription so users don't need their own API keys. The free tier (local processing) works without any backend at all.

## Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Auth | Supabase Auth | Free tier (50K MAU), built-in email + Google OAuth, JWT tokens |
| Database | Supabase Postgres | Comes with auth, row-level security, realtime |
| Billing | Stripe | Industry standard, Checkout hosted pages, webhooks |
| API Proxy | Supabase Edge Functions (Deno) | Serverless, auto-scaling, no server management |
| Hosting | Vercel (website) + Supabase (backend) | Both free tiers are generous |

## Database Schema

```sql
-- profiles: extends Supabase auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',           -- 'free', 'pro', 'lifetime'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  words_used_this_period INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security: users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- usage_logs: track API usage for billing/limits
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  words INTEGER NOT NULL,
  provider TEXT NOT NULL,        -- 'groq-stt', 'groq-cleanup'
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own logs" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Reset word counts monthly
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET words_used_this_period = 0,
      period_start = NOW()
  WHERE period_start < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```

## API Endpoints (Supabase Edge Functions)

### POST /api/transcribe
Proxies audio to Groq Whisper API using VoiceFlow's API key.

```typescript
// supabase/functions/transcribe/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Validate auth token
  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader! } }
  })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  // 2. Check plan & usage limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, words_used_this_period')
    .eq('id', user.id)
    .single()

  if (profile?.plan === 'free' && profile.words_used_this_period >= 2000) {
    return new Response(JSON.stringify({
      error: 'Free tier limit reached (2,000 words/week). Upgrade to Pro for unlimited.'
    }), { status: 429 })
  }

  // 3. Forward to Groq Whisper API
  const formData = await req.formData()
  const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: formData,
  })

  const result = await groqResponse.json()

  // 4. Log usage
  const wordCount = result.text?.split(/\s+/).length ?? 0
  await supabase.from('usage_logs').insert({
    user_id: user.id,
    words: wordCount,
    provider: 'groq-stt',
  })

  // 5. Increment usage counter
  await supabase.rpc('increment_words', {
    user_id: user.id,
    word_count: wordCount,
  })

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### POST /api/cleanup
Proxies text to Groq Llama for AI cleanup.

Same pattern as transcribe — auth check, usage check, forward to Groq, log usage.

### POST /api/stripe-webhook
Handles Stripe subscription events.

```typescript
// Events to handle:
// - checkout.session.completed → update profile.plan to 'pro' or 'lifetime'
// - customer.subscription.updated → update plan
// - customer.subscription.deleted → downgrade to 'free'
// - invoice.payment_failed → notify user
```

### GET /api/usage
Returns current usage stats for the authenticated user.

```json
{
  "plan": "free",
  "words_used": 1234,
  "words_limit": 2000,
  "period_start": "2026-02-01T00:00:00Z"
}
```

## Stripe Configuration

### Products
- **VoiceFlow Pro Monthly**: $8/mo, recurring
- **VoiceFlow Pro Lifetime**: $39, one-time

### Checkout Flow
1. User clicks "Upgrade to Pro" in desktop app Settings
2. App opens Stripe Checkout URL in default browser
3. User completes payment on Stripe's hosted page
4. Stripe webhook fires → Edge Function updates profile.plan
5. App polls /api/usage to detect plan change
6. Pro features unlock in the app

### Webhook Events
```
checkout.session.completed → Create subscription, set plan='pro'
customer.subscription.deleted → Set plan='free'
invoice.payment_failed → Email user, grace period
```

## Desktop App Integration

### Auth Flow (Electron)
```typescript
// In Settings page:
// 1. User clicks "Sign In" → opens Supabase auth URL in browser
// 2. Supabase redirects to deep link: voiceflow://auth/callback?token=...
// 3. Electron handles protocol, stores session token
// 4. All API calls include Authorization: Bearer <token>

// Protocol handler registration (in main process):
app.setAsDefaultProtocolClient('voiceflow')

app.on('open-url', (event, url) => {
  // Parse token from voiceflow://auth/callback?token=...
  const token = new URL(url).searchParams.get('token')
  if (token) {
    store.set('auth_token', token)
    mainWindow.webContents.send('auth-complete', token)
  }
})
```

### API Proxy Usage (replacing direct Groq calls for Pro users)
```typescript
// When user has Pro plan, route through our proxy:
if (user.plan === 'pro') {
  const response = await fetch('https://your-project.supabase.co/functions/v1/transcribe', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: formData,
  })
} else {
  // Free tier: use local whisper.cpp (no API call)
  const text = await localWhisper.transcribe(audioBlob)
}
```

## Cost Analysis

### Per-User Costs (Pro tier)
| Service | Cost | Notes |
|---------|------|-------|
| Groq Whisper | ~$0.04/hr | Average user: 15 min/day = $0.30/mo |
| Groq Llama | ~$0.01/mo | Text cleanup is tiny tokens |
| Supabase | $0/user | Free tier: 50K MAU |
| Stripe | 2.9% + $0.30 | Per transaction |
| **Total** | **~$0.50/user/mo** | |

### Revenue per User
- Monthly: $8/mo - $0.50 cost = **$7.50 profit/mo**
- Lifetime: $39 - $0.50/mo (LTV ~36 months) = **~$21 profit**

### Break-even
- Supabase Pro plan ($25/mo) needed at ~100 users
- 4 monthly subscribers cover Supabase costs
- Everything else scales with usage (Groq pay-per-use)

## Security

- Auth tokens stored encrypted via Electron safeStorage
- All API calls over HTTPS
- Row-level security on all database tables
- VoiceFlow's Groq API key never exposed to client
- Stripe webhook signature verification
- Rate limiting on edge functions
- No audio stored server-side (processed and discarded)
