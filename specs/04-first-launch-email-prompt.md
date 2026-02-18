# Spec 04: First-Launch Email Prompt

## Summary
The existing `WelcomeModal` (onboarding) already asks for email on first launch with a "Skip for now" option. This spec adds a periodic reminder for users who skipped the email step, so they eventually provide an email for trial tracking.

## Requirements
- If user skipped the email step during onboarding (no `userEmail` stored), remind them periodically
- Show reminder as a banner at the top of the Settings page (not a blocking modal)
- Show the reminder on the **3rd, 7th, and 14th** app session (not every time)
- Banner says: "Enter your email to track your free trial" with an inline email input + Activate button
- Banner is dismissible (X button) — dismissed for that session only
- Once email is entered and validated, banner never shows again
- Track session count in electron-store

## Implementation Notes

### Session counter
- Add `sessionCount: number` to `AppSettings` in `electron/main/store.ts` (default: 0)
- Increment on app startup in `initStore()` or in main process `app.whenReady()`
- Add to `getAllSettings()` return value

### Email reminder banner
- Create new component: `src/components/settings/EmailReminder.tsx`
- Render it at the top of `AccountSection.tsx`, before UsageBanner
- Show conditions:
  1. `!userEmail` (no email stored)
  2. `sessionCount` is 3, 7, or 14+
  3. Not dismissed this session (local state)
  4. `licenseStatus !== 'active'` (no paid license)

### Banner design
```
┌──────────────────────────────────────────────────────────────┐
│ ℹ️  Enter your email to activate your free trial    [X]      │
│                                                              │
│ [ you@example.com          ]  [Activate]                     │
│                                                              │
│ Your email lets us track your 30-day trial.                  │
│ No spam — just trial status.                                 │
└──────────────────────────────────────────────────────────────┘
```

- Use existing card/border styling consistent with LicenseInput
- Info icon from lucide-react (`Info`)
- Reuse the same `validateByEmail` flow from LicenseInput/WelcomeModal
- On successful activation: banner disappears, LicenseInput updates

### Key files to modify
- `electron/main/store.ts` — Add `sessionCount` to AppSettings + defaults + getAllSettings, increment on init
- `src/components/settings/EmailReminder.tsx` — NEW FILE: reminder banner component
- `src/components/settings/AccountSection.tsx` — Render EmailReminder above UsageBanner

### Existing patterns
- Email validation: see `WelcomeModal.tsx` lines 16-37 for the activate flow
- Settings access: `useSettings()` hook provides all settings
- Card styling: see `LicenseInput.tsx` for border/bg patterns

## Acceptance Criteria
- [ ] `sessionCount` is tracked in electron-store and increments on each app launch
- [ ] Email reminder banner appears on the Settings page when: no email + session 3, 7, or 14+
- [ ] Banner does NOT appear if user already has an email stored
- [ ] Banner does NOT appear if user has an active license
- [ ] Banner has a working email input + Activate button (reuses validate-by-email flow)
- [ ] Banner has a dismiss X button that hides it for the current session
- [ ] After successful email activation, banner disappears permanently
- [ ] App builds successfully: `npm run build`

**Output when complete:** `<promise>DONE</promise>`
