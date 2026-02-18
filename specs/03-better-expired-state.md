# Spec 03: Better Trial Expired State

## Summary
Replace the 2-second lock icon in the overlay with a persistent, actionable message when trial expires and user tries to record. Give them clear next steps instead of a cryptic lock icon.

## Requirements
- When trial expires and user presses hotkey, overlay shows an expanded state with:
  - Lock icon + "Trial expired" heading
  - Two clear action buttons:
    1. "Use Own API Key" → opens main window to Settings page (API key section)
    2. "Upgrade to Pro" → opens pricing page in default browser
  - A dismiss/close button (X) to close the overlay
- The expanded overlay stays visible until user clicks an action or dismisses
- No more auto-hide after 2 seconds for trial expiration (errors can still auto-hide)

## Implementation Notes

### OverlayShell changes (`src/components/layout/OverlayShell.tsx`)
- Current behavior (lines 129-148): shows lock + "Trial expired" for 2 seconds, then resets `trialExpired` to false
- Change: remove the `setTimeout(() => setTrialExpired(false), 2000)` from the `onTrialExpired` handler
- Instead, keep `trialExpired` true until user dismisses
- Replace the simple lock pill with an expanded view containing action buttons

### Expanded trial-expired overlay layout
```
┌─────────────────────────────────────────┐
│  🔒 Trial expired                    X  │
│                                         │
│  [Use Own API Key]  [Upgrade to Pro]    │
└─────────────────────────────────────────┘
```

- Style: same dark pill aesthetic (`bg-black/90 border border-white/10 rounded-2xl`)
- "Use Own API Key" button: sends IPC `show-main-window` + navigates to settings
- "Upgrade to Pro" button: opens `https://voxgenflow.vercel.app/#pricing` via `window.electronAPI.openExternal(url)` or `shell.openExternal`
- X button: sets `trialExpired = false` and sends `overlay:shrink` or `hideOverlay()`

### Overlay window sizing
- The overlay needs to be bigger to show this content
- Currently the overlay is 380x200 but the pill is small
- The expanded content should fit within the existing overlay dimensions
- Use similar sizing to the recording state pill but wider

### IPC for "Use Own API Key" action
- Send `show-main-window` IPC (already exists) to bring up main window
- Optionally send a new IPC `navigate-to-settings` so the main window opens on the Settings page
- Or use existing `setting-changed` broadcast pattern

### Key files to modify
- `src/components/layout/OverlayShell.tsx` — Replace trial-expired section with actionable UI
- Possibly `electron/main/windows.ts` — If overlay needs resizing for expanded state

### Existing patterns
- Overlay styling: see recording state section in OverlayShell.tsx (lines 85-114)
- IPC: `window.electronAPI?.showMainWindow()` for opening main window
- External links: `window.electronAPI?.openExternal(url)` or fall back to `window.open(url, '_blank')`

## Acceptance Criteria
- [ ] When trial expires and user presses hotkey, overlay shows expanded message (not just a lock icon)
- [ ] Overlay shows "Trial expired" heading with Lock icon
- [ ] "Use Own API Key" button opens the main window (Settings page)
- [ ] "Upgrade to Pro" button opens pricing page in default browser
- [ ] X button dismisses the overlay
- [ ] The overlay does NOT auto-hide after 2 seconds for trial expiration
- [ ] Regular error states still auto-hide after 3 seconds (no regression)
- [ ] App builds successfully: `npm run build`

**Output when complete:** `<promise>DONE</promise>`
