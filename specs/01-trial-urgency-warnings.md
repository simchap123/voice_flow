# Spec 01: Trial Urgency Warnings

## Summary
Show non-blocking warnings when the user's 30-day trial is approaching expiration. Displayed at app startup in the main window as a toast notification.

## Requirements
- On app startup (main window load), check trial days remaining
- Show a toast notification at **7 days**, **3 days**, and **1 day** remaining
- Toast should be dismissible and non-blocking (use existing toast system from `@/hooks/useToast`)
- Only show once per threshold per session (don't re-show on page navigation)
- Don't show warnings if user has an active paid license
- Don't show warnings if user has their own API key configured (BYOK users don't need trial)
- Use variant `'default'` for 7-day warning, `'error'` for 3-day and 1-day warnings

## Implementation Notes

### Where to add the check
- In `src/App.tsx` `MainApp` component, after settings are loaded (`isLoaded === true`)
- Use a `useEffect` that runs once when `isLoaded` becomes true
- Call `window.electronAPI.getLicenseInfo()` to get `trialStartedAt` and `licenseStatus`
- Calculate days left: `Math.max(0, Math.ceil(30 - daysUsed))`

### Toast content
- **7 days left:** title: "Trial ending soon", description: "Your free trial expires in 7 days. Add your own API key or upgrade to Pro."
- **3 days left:** title: "Trial expires in 3 days", description: "Your free trial is almost over. Upgrade to keep using managed transcription."
- **1 day left:** title: "Trial expires tomorrow!", description: "Last day of your free trial. Upgrade now or add your own API key in Settings."

### Existing patterns
- Toast system: `import { toast } from '@/hooks/useToast'` then `toast({ title, description, variant })`
- Toast UI: `src/components/ui/toast.tsx` (Radix-based, already rendered in App.tsx)
- License info: `window.electronAPI.getLicenseInfo()` returns `{ licenseStatus, trialStartedAt, userEmail, ... }`
- Settings hook: `useSettings()` provides `hasApiKey` to check BYOK status

### Key files to modify
- `src/App.tsx` — Add useEffect in MainApp for trial warning check

## Acceptance Criteria
- [ ] When trial has 7 days left, a toast appears on app startup saying trial is ending soon
- [ ] When trial has 3 days left, a red-variant toast appears on app startup
- [ ] When trial has 1 day left, a red-variant toast appears with urgent language
- [ ] Toast does NOT appear if user has an active paid license (`licenseStatus === 'active'`)
- [ ] Toast does NOT appear if user has their own API key configured (BYOK)
- [ ] Toast only appears once per app session (not on every page navigation)
- [ ] App builds successfully: `npm run build`

**Output when complete:** `<promise>DONE</promise>`
