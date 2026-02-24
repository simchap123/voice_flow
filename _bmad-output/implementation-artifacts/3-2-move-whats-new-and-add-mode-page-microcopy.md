# Story 3.2: Move "What's New" and Add Mode Page Microcopy

Status: done

## Story

As a user,
I want "What's New" logically grouped with updates, and mode pages that explain themselves at a glance,
So that I can find features where I expect them and understand each page without needing documentation.

## Acceptance Criteria

1. **Given** the Settings > Notifications tab is open
   **When** the Updates section renders
   **Then** a "What's New →" link appears in the Updates section (after version/check for updates)
   **And** clicking it opens the external changelog URL (`voxgenflow.vercel.app/whats-new.html`)

2. **Given** the Settings > Account tab is open
   **When** it renders
   **Then** the "What's New" sparkle button is no longer present in the License section header

3. **Given** the Dictation Mode page is open
   **When** it renders
   **Then** the page header shows microcopy: "Press a hotkey to record your voice. Speech is transcribed and typed into the active app."

4. **Given** the AI Prompt Mode page is open
   **When** it renders
   **Then** the page header shows microcopy: "Speak a prompt to generate AI content. Use keyword triggers to activate generation."

5. **Given** all changes are complete
   **When** the following settings are checked
   **Then** Generation settings (keyword triggers, prompt refinement, output length) remain on AI Prompt page (FR21)
   **And** Context settings (clipboard, active window) remain on AI Prompt page (FR22)
   **And** Sound effects, Error alerts, Auto-update, and Version check remain in Notifications (FR23)
   **And** License management remains in Account (FR24)
   **And** DevTools (admin-only) remains in Account (FR25)

## Tasks / Subtasks

- [x] Task 1: Move "What's New" from Account to Notifications > Updates (AC: 1, 2)
  - [x] 1.1 Remove the "What's New" sparkle button from Account tab License section header
  - [x] 1.2 Add "What's New" row to the end of the Updates section in Notifications tab
  - [x] 1.3 New row opens `https://voxgenflow.vercel.app/whats-new.html` via `window.electronAPI?.openExternal()`
  - [x] 1.4 Add `type="button"` attribute
- [x] Task 2: Update Dictation Mode page microcopy (AC: 3)
  - [x] 2.1 Replace DictationModePage header description text
- [x] Task 3: Update AI Prompt Mode page microcopy (AC: 4)
  - [x] 3.1 Replace AIPromptModePage header description text
- [x] Task 4: Verify existing settings preserved (AC: 5)
  - [x] 4.1 Verify Generation settings remain on AI Prompt page
  - [x] 4.2 Verify Context settings remain on AI Prompt page
  - [x] 4.3 Verify Sound/Error/Update/Version remain in Notifications
  - [x] 4.4 Verify License + DevTools remain in Account
- [x] Task 5: Build verification (AC: all)
  - [x] 5.1 Run `npm run build` — zero errors

## Dev Notes

### Previous Story Intelligence (Stories 1.1–3.1)

- Always add `type="button"` on non-form buttons
- `onNavigate` props should be required, not optional
- Settings use `useSettings()` hook
- Build must pass all 3 Vite targets
- Animation delays cascade by 0.06s per section

### "What's New" Button — Current Location (REMOVE)

`src/pages/SettingsPage.tsx` — Account tab, License section header (lines 677-683):

```tsx
<button
  onClick={() => window.electronAPI?.openExternal('https://voxgenflow.vercel.app/whats-new.html')}
  className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 hover:text-primary transition-colors"
>
  <Sparkles className="h-3.5 w-3.5" />
  What's New
</button>
```

This is inside a `flex items-center justify-between mb-4` div with the License heading. Remove the entire `<button>...</button>` element. The `Sparkles` icon import is still used in the Updates section heading, so do NOT remove the import.

### "What's New" — New Location (ADD)

Insert after the version/update check row in the Notifications > Updates section. Follow the existing row pattern:

```tsx
<div className="border-t border-border/10" />
<div className="flex items-center gap-5 py-3">
  <div className="w-[160px] shrink-0">
    <div className="text-[13px] font-medium text-muted-foreground">What's New</div>
    <div className="text-[10px] text-muted-foreground/40">View latest changes</div>
  </div>
  <div className="flex-1">
    <button
      type="button"
      onClick={() => window.electronAPI?.openExternal('https://voxgenflow.vercel.app/whats-new.html')}
      className="flex items-center gap-1.5 text-[11px] text-primary hover:underline transition-colors"
    >
      <Sparkles className="w-3 h-3" />
      What's New →
    </button>
  </div>
</div>
```

Insert this inside the `<div className="space-y-0">` of the Updates section, after the version check row's closing `</div>` and before the section's `</div>`.

### Microcopy Updates

**DictationModePage.tsx** (line 17):
- Current: `"Hold-to-record and toggle recording configuration"`
- Target: `"Press a hotkey to record your voice. Speech is transcribed and typed into the active app."`

**AIPromptModePage.tsx** (line 28):
- Current: `"Speak instructions, AI generates full content"`
- Target: `"Speak a prompt to generate AI content. Use keyword triggers to activate generation."`

### Sparkles Icon Import

`Sparkles` is imported at SettingsPage.tsx line 10. It's used in TWO places:
1. Account tab License header "What's New" button (REMOVING)
2. Notifications tab Updates section heading (KEEPING)

Do NOT remove the `Sparkles` import — it's still needed.

### What This Story Does NOT Include

- Does NOT modify PromptsSection or AIPromptsPage
- Does NOT add onNavigate to DictationModePage (not needed for microcopy-only change)
- Does NOT delete any files (that's Story 4.1)
- Does NOT change Sidebar navigation
- Does NOT modify Audio Input section (done in Story 3.1)

### Project Structure Notes

- **Modified file:** `src/pages/SettingsPage.tsx` (move What's New from Account to Notifications)
- **Modified file:** `src/pages/DictationModePage.tsx` (update header microcopy)
- **Modified file:** `src/pages/AIPromptModePage.tsx` (update header microcopy)
- No new files needed
- All imports use `@/` path alias

### References

- [Source: src/pages/SettingsPage.tsx:677-683] — "What's New" button to remove from Account
- [Source: src/pages/SettingsPage.tsx:605-660] — Updates section in Notifications (insertion point)
- [Source: src/pages/DictationModePage.tsx:17] — Current Dictation microcopy
- [Source: src/pages/AIPromptModePage.tsx:28] — Current AI Prompt microcopy
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:614-620] — Target microcopy strings
- [Source: _bmad-output/planning-artifacts/epics.md:266-297] — Story 3.2 acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No errors encountered.

### Completion Notes List

- Removed "What's New" sparkle button from Account tab License section header
- Simplified Account License header from `flex justify-between` to simple `mb-4` div (no longer needs space for button)
- Added "What's New →" row to Notifications > Updates section with `type="button"`, Sparkles icon, text-primary styling
- Sparkles import retained (still used in Updates section heading)
- Updated DictationModePage microcopy to UX spec text
- Updated AIPromptModePage microcopy to UX spec text
- All existing settings verified in place (Generation, Context, Sound, License, DevTools)
- Build passes cleanly — all 3 Vite targets

### File List

- `src/pages/SettingsPage.tsx` (MODIFIED — moved What's New from Account to Notifications)
- `src/pages/DictationModePage.tsx` (MODIFIED — updated header microcopy)
- `src/pages/AIPromptModePage.tsx` (MODIFIED — updated header microcopy)
