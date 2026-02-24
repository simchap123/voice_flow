# Story 1.2: Replace Hotkey Editors in Settings with Read-Only Badges

Status: done

## Story

As a user,
I want the Settings > General page to show my hotkeys as a compact read-only summary with links to edit them,
so that I can see all my hotkeys at a glance and know exactly where to change each one.

## Acceptance Criteria

1. **Given** the Settings > General tab is open
   **When** the Recording section renders
   **Then** it displays 3 HotkeyBadge components: "Hold-to-Record" (linking to Dictation), "Toggle Recording" (linking to Dictation), and "AI Prompt" (linking to AI Prompt)
   **And** the HotkeyRecorder components previously in this section are removed
   **And** each badge shows the current hotkey value from settings (holdHotkey, toggleHotkey, promptHotkey)

2. **Given** a user clicks "Edit →" on the Hold-to-Record badge in Settings
   **When** the navigation completes
   **Then** the Dictation mode page loads and the HotkeyRecorder for Hold-to-Record is visible and editable

3. **Given** the holdHotkey is changed on the Dictation mode page
   **When** the user navigates back to Settings > General
   **Then** the Hold-to-Record HotkeyBadge shows the updated hotkey value

4. **Given** the Toggle Recording hotkey was not previously shown in Settings > General
   **When** Settings > General renders after this change
   **Then** a new HotkeyBadge row for Toggle Recording appears (added for discoverability)

## Tasks / Subtasks

- [x] Task 1: Replace HotkeyRecorders with HotkeyBadges in SettingsPage Recording section (AC: 1, 2, 3, 4)
  - [x] 1.1 Add `HotkeyBadge` import, remove `HotkeyRecorder` import
  - [x] 1.2 Replace Hold-to-Record HotkeyRecorder with HotkeyBadge (`settings.holdHotkey`, editPage `"dictation"`)
  - [x] 1.3 Add NEW Toggle Recording row with HotkeyBadge (`settings.toggleHotkey`, editPage `"dictation"`)
  - [x] 1.4 Replace AI Prompt HotkeyRecorder with HotkeyBadge (`settings.promptHotkey`, editPage `"ai-prompt"`)
  - [x] 1.5 Pass `onNavigate` prop to each HotkeyBadge
  - [x] 1.6 Update section subtitle from "Hotkeys and trigger methods" to "Hotkey summary" (read-only now)
- [x] Task 2: Verify build succeeds (AC: all)
  - [x] 2.1 Run `npm run build` — zero errors

## Dev Notes

### Previous Story Intelligence (Story 1.1)

Story 1.1 completed successfully with these outcomes:
- `HotkeyBadge` component at `src/components/settings/hotkey-badge.tsx` — READY to use
- `SettingsPage` already accepts `onNavigate?: (page: string) => void` prop via `SettingsPageProps` interface
- `App.tsx` already passes `onNavigate={setCurrentPage}` to SettingsPage
- Code review applied: `type="button"`, exported interface, named SettingsPageProps, semantic keys

### Exact Code to Replace

The Recording section is at `src/pages/SettingsPage.tsx:273-319`. Current structure:

```
Recording section (lines 273-319):
├── Section header: "Recording" / "Hotkeys and trigger methods"
├── Row 1: Hold to record → HotkeyRecorder (settings.holdHotkey) [REPLACE]
├── Divider
├── Row 2: AI Prompt → HotkeyRecorder (settings.promptHotkey) [REPLACE]
└── (no Toggle Recording row exists) [ADD NEW]
```

Target structure:
```
Recording section:
├── Section header: "Recording" / "Hotkey summary"
├── Row 1: Hold to record → HotkeyBadge (holdHotkey, editPage="dictation")
├── Divider
├── Row 2: Toggle Recording → HotkeyBadge (toggleHotkey, editPage="dictation") [NEW]
├── Divider
├── Row 3: AI Prompt → HotkeyBadge (promptHotkey, editPage="ai-prompt")
```

### Import Changes

**Remove** (line 4):
```typescript
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
```

**Add:**
```typescript
import { HotkeyBadge } from '@/components/settings/hotkey-badge'
```

`HotkeyRecorder` is ONLY used in the Recording section (lines 287, 307). No other usage in SettingsPage — safe to remove the import entirely.

### Settings Keys

All three settings keys exist in `src/types/settings.ts`:
- `holdHotkey: string` (default: `'RightAlt'`)
- `toggleHotkey: string` (default: `'Alt+Left'`)
- `promptHotkey: string` (default: `''`)

Already accessed via `const { settings } = useSettings()` at line 156.

### Row Layout Pattern (preserve existing)

Each row uses the 2-column layout already established:
```tsx
<div className="flex items-start gap-5 py-3">
  <div className="w-[160px] shrink-0">
    <div className="text-[13px] font-medium text-muted-foreground flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground/50" />
      Label text
    </div>
  </div>
  <div className="flex-1">
    <HotkeyBadge
      label="Label"
      hotkey={settings.settingKey}
      editPage="page-id"
      onNavigate={onNavigate!}
    />
  </div>
</div>
```

### onNavigate Non-Null Assertion

`onNavigate` is typed as optional (`onNavigate?: ...`) for backward compatibility. In the Recording section, use `onNavigate!` (non-null assertion) since App.tsx always provides it. Alternatively, provide a no-op fallback: `onNavigate ?? (() => {})`.

### Icons for Each Row

- Hold to record: `Mic` (already used, line 282)
- Toggle Recording: `Mic` (same icon — both are recording modes)
- AI Prompt: `Zap` (already used, line 302)

### Toggle Recording Icon Choice

The Toggle Recording row is NEW. Use `Mic` to match "Hold to record" since both control recording. The existing AI Prompt uses `Zap` which differentiates it clearly.

### What This Story Does NOT Include

- Does NOT modify DictationModePage or AIPromptModePage (hotkey editors stay on mode pages)
- Does NOT move MicrophoneSelect or LanguageSelect (that's Story 3.1)
- Does NOT remove HotkeyRecorder.tsx file (still used by mode pages)
- Does NOT change any hotkey functionality — purely visual replacement in Settings

### Project Structure Notes

- **Modified file:** `src/pages/SettingsPage.tsx` (replace Recording section content, swap imports)
- No new files needed
- All imports use `@/` path alias

### References

- [Source: src/pages/SettingsPage.tsx:273-319] — Current Recording section to replace
- [Source: src/pages/SettingsPage.tsx:4] — HotkeyRecorder import to remove
- [Source: src/components/settings/hotkey-badge.tsx] — HotkeyBadge component (Story 1.1)
- [Source: src/types/settings.ts:9,61] — toggleHotkey setting definition and default
- [Source: _bmad-output/planning-artifacts/epics.md:160-185] — Story 1.2 acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No errors encountered.

### Completion Notes List

- Replaced HotkeyRecorder import with HotkeyBadge import
- Replaced 2 editable HotkeyRecorders (Hold-to-Record, AI Prompt) with 3 read-only HotkeyBadges
- Added NEW Toggle Recording row (settings.toggleHotkey, default "Alt+Left") for discoverability (AC 4)
- Each badge uses onNavigate! (non-null assertion) since App.tsx always provides it
- Section subtitle changed from "Hotkeys and trigger methods" to "Hotkey summary"
- Toggle Recording uses Mic icon (matching Hold-to-Record); AI Prompt keeps Zap icon
- Build passes cleanly — all 3 Vite targets

### File List

- `src/pages/SettingsPage.tsx` (MODIFIED — replaced Recording section, swapped imports)
