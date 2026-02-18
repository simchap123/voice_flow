# Spec 02: Stripe Customer Portal Link

## Summary
Add a "Manage Subscription" button in the Account settings so paying users can cancel, update payment methods, and view invoices via Stripe's hosted Customer Portal.

## Requirements
- New Vercel API endpoint: `POST /api/customer-portal`
- "Manage Subscription" button visible ONLY when user has an active paid license (`licenseStatus === 'active'`)
- Button opens the Stripe Customer Portal URL in the user's default browser
- Uses the user's email to look up their Stripe customer ID

## Implementation Notes

### Backend: `api/customer-portal.ts`
```typescript
// POST /api/customer-portal
// Request: { email: string }
// Response: { url: string }
//
// 1. Look up user by email in Supabase `users` table
// 2. Find their license in `user_licenses` to get `stripe_customer_id`
// 3. Create a Stripe Billing Portal session: stripe.billingPortal.sessions.create()
// 4. Return the portal URL
```

- Use existing `api/lib/supabase.ts` for DB access
- Use existing Stripe instance pattern from `api/checkout.ts`
- Return URL: `{ url: session.url }`
- `return_url` should be `APP_URL` (website homepage)
- If no Stripe customer found, return `{ error: 'No billing account found' }`

### Frontend: `src/components/settings/LicenseInput.tsx`
- Add button inside the active license display block (the green `isActive` section, around line 118-145)
- Place it next to the existing "Remove" button
- Use `<Button variant="outline" size="sm">Manage Subscription</Button>`
- Icon: `ExternalLink` from lucide-react
- On click: call new IPC handler → main process makes API call → opens URL in default browser

### IPC: New channel `license:customer-portal`
- Add handler in `electron/main/ipc.ts` (or wherever IPC handlers are registered)
- Handler: takes email, POSTs to `/api/customer-portal`, opens returned URL with `shell.openExternal(url)`
- Expose in preload: `window.electronAPI.openCustomerPortal(email: string)`

### Key files to modify
- `api/customer-portal.ts` — NEW FILE: Vercel serverless endpoint
- `src/components/settings/LicenseInput.tsx` — Add "Manage Subscription" button in active license section
- Electron IPC registration file — Add `license:customer-portal` handler
- Preload script — Expose `openCustomerPortal` method

### Existing patterns to follow
- API structure: see `api/checkout.ts` for Stripe usage
- IPC pattern: see `electron/main/license.ts` for `netFetch` + `API_BASE`
- Supabase client: `api/lib/supabase.ts`
- Shell open: `import { shell } from 'electron'` → `shell.openExternal(url)`

## Acceptance Criteria
- [ ] New `api/customer-portal.ts` endpoint creates a Stripe Billing Portal session
- [ ] "Manage Subscription" button appears in LicenseInput when license is active
- [ ] Button does NOT appear when user is on trial or has no license
- [ ] Clicking the button opens the Stripe Customer Portal in default browser
- [ ] If Stripe customer not found, shows a user-friendly error
- [ ] App builds successfully: `npm run build`

**Output when complete:** `<promise>DONE</promise>`
