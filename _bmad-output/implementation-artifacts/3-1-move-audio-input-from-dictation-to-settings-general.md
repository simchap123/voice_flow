# Story 3.1: Move Audio Input from Dictation to Settings > General

Status: done

## Story

As a user,
I want microphone and language settings in Settings > General,
So that I can configure audio input in one place that clearly applies to all recording modes — not buried under Dictation only.

## Acceptance Criteria

1. **Given** the Settings > General tab is open
   **When** it renders
   **Then** a new "Audio Input" section appears (after Hotkey Summary, before Speech-to-Text)
   **And** it contains MicrophoneSelect (bound to `audioInputDeviceId`) and LanguageSelect (bound to `language`)

2. **Given** the Dictation Mode page is open
   **When** it renders
   **Then** the MicrophoneSelect and LanguageSelect components are no longer present
   **And** the "Audio Input" section card is removed entirely from this page

3. **Given** the user changes the microphone in Settings > General > Audio Input
   **When** they start a recording from any mode (Dictation or AI Prompt)
   **Then** the selected microphone is used for recording

4. **Given** all changes are complete
   **When** the following settings are checked
   **Then** Code Mode toggle remains on Dictation page (FR18)
   **And** STT Provider, API Key dialog, and Local Model management remain in Settings > General (FR19, FR26)
   **And** Auto-paste and AI Cleanup toggles remain in Settings > General > Preferences (FR20)
   **And** isManagedMode "VoxGen Cloud" message is preserved in STT Provider section (FR27)

## Tasks / Subtasks

- [x] Task 1: Remove Audio Input section from DictationModePage (AC: 2)
  - [x] 1.1 Remove `import { LanguageSelect } from '@/components/settings/LanguageSelect'` (line 4)
  - [x] 1.2 Remove `import { MicrophoneSelect } from '@/components/settings/MicrophoneSelect'` (line 5)
  - [x] 1.3 Remove the entire `{/* Audio Input */}` card section (lines 79-93)
- [x] Task 2: Add Audio Input section to SettingsPage General tab (AC: 1)
  - [x] 2.1 Add `import { LanguageSelect } from '@/components/settings/LanguageSelect'`
  - [x] 2.2 Add `import { MicrophoneSelect } from '@/components/settings/MicrophoneSelect'`
  - [x] 2.3 Add new "Audio Input" section between Recording section and STT Provider section
  - [x] 2.4 Use Settings flat section pattern with `settings-section-enter` animation class
  - [x] 2.5 Adjust animation delays: Audio Input = 0.06s, STT Provider = 0.12s, Preferences = 0.18s
- [x] Task 3: Verify existing settings are preserved (AC: 3, 4)
  - [x] 3.1 Verify Code Mode toggle remains on DictationModePage
  - [x] 3.2 Verify STT Provider, API Key dialog, Local Model remain in Settings General
  - [x] 3.3 Verify Auto-paste and AI Cleanup remain in Preferences
  - [x] 3.4 Verify isManagedMode message preserved
- [x] Task 4: Build verification (AC: all)
  - [x] 4.1 Run `npm run build` — zero errors

## Dev Notes

### Previous Story Intelligence (Stories 1.1, 1.2, 2.1, 2.2)

Key learnings from prior stories:
- `onNavigate` props should be REQUIRED, not optional (Story 1.2 code review)
- Always add `type="button"` on buttons not inside forms (Story 2.1 code review)
- Use semantic React keys (e.g., `key={part}`) not index-based keys
- Settings use `useSettings()` hook with `settings.X` and `updateSetting('X', v)`
- Build must pass all 3 Vite targets (renderer, main, preload)

### Section Order in Settings > General (CRITICAL)

Per UX spec (line 439): `Hotkey Summary → Audio Input → STT → Preferences`

Current state of SettingsPage General tab:
1. **Recording** (Hotkey Summary) — lines 273-330, `animationDelay: '0s'`
2. **STT Provider** — lines 332-502, `animationDelay: '0.06s'`
3. **Preferences** — lines 504-539, `animationDelay: '0.12s'`

After this story:
1. **Recording** (Hotkey Summary) — `animationDelay: '0s'` (unchanged)
2. **Audio Input** (NEW) — `animationDelay: '0.06s'`
3. **STT Provider** — `animationDelay: '0.12s'` (bumped from 0.06s)
4. **Preferences** — `animationDelay: '0.18s'` (bumped from 0.12s)

### Exact Code to Remove from DictationModePage

```
Line 4:  import { LanguageSelect } from '@/components/settings/LanguageSelect'
Line 5:  import { MicrophoneSelect } from '@/components/settings/MicrophoneSelect'
Lines 79-93:
        {/* Audio Input */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4 space-y-3">
          <div>
            <div className="text-[13px] font-semibold">Audio Input</div>
            <div className="text-[10px] text-muted-foreground/50">Language and microphone settings</div>
          </div>
          <MicrophoneSelect
            value={settings.audioInputDeviceId}
            onChange={(v) => updateSetting('audioInputDeviceId', v)}
          />
          <LanguageSelect
            value={settings.language}
            onChange={(v) => updateSetting('language', v)}
          />
        </div>
```

After removal, DictationModePage structure becomes:
```
Header → Hold-to-Record card → Toggle Recording card → Options card (Code Mode)
```

### Settings Page Audio Input Section Pattern

Use the SettingsPage flat layout pattern (like Recording and Preferences sections), NOT the DictationModePage card style. The section follows this structure:

```tsx
{/* Audio Input */}
<div className="settings-section-enter py-5 border-b border-border/20" style={{ animationDelay: '0.06s' }}>
  <div className="mb-4">
    <div className="text-[14px] font-semibold">Audio Input</div>
    <div className="text-[12px] text-muted-foreground/50">Microphone and language for all recording modes</div>
  </div>
  <div className="space-y-3">
    <div className="flex items-start gap-5">
      <div className="w-[160px] shrink-0">
        <div className="text-[13px] font-medium text-muted-foreground">Microphone</div>
      </div>
      <div className="flex-1">
        <MicrophoneSelect
          value={settings.audioInputDeviceId}
          onChange={(v) => updateSetting('audioInputDeviceId', v)}
        />
      </div>
    </div>
    <div className="flex items-start gap-5">
      <div className="w-[160px] shrink-0">
        <div className="text-[13px] font-medium text-muted-foreground">Language</div>
      </div>
      <div className="flex-1">
        <LanguageSelect
          value={settings.language}
          onChange={(v) => updateSetting('language', v)}
        />
      </div>
    </div>
  </div>
</div>
```

**Note:** MicrophoneSelect and LanguageSelect already include their own `<Label>` elements internally. The Settings layout wraps them in the standard `w-[160px]` label + `flex-1` control pattern. Since the components already have labels, the wrapper label provides section-level context while the component labels provide field-level context. If this creates visual duplication, consider whether to simplify by just rendering the components directly within the section without the extra row wrapper — the key requirement is that the section exists between Recording and STT.

### Insertion Point in SettingsPage

Insert the new Audio Input section at line 331 — after the Recording section's closing `</div>` (line 330) and before the `{/* STT Provider */}` comment (line 332).

### Animation Delay Updates

Three sections need delay changes:
- **Audio Input** (NEW): `style={{ animationDelay: '0.06s' }}`
- **STT Provider** (existing line 333): change from `'0.06s'` to `'0.12s'`
- **Preferences** (existing line 505): change from `'0.12s'` to `'0.18s'`

### Component Analysis

**MicrophoneSelect** (`src/components/settings/MicrophoneSelect.tsx`):
- Props: `{ value: string, onChange: (deviceId: string) => void }`
- Has internal `<Label>` with Mic icon + "Microphone" text
- Has internal description: "Select which microphone to use for recording"
- Handles `getUserMedia` permissions and device enumeration
- Listens for `devicechange` events (plug/unplug)
- Uses native `<select>` with "System Default" option

**LanguageSelect** (`src/components/settings/LanguageSelect.tsx`):
- Props: `{ value: string, onChange: (value: string) => void }`
- Has internal `<Label>` "Language"
- Uses shadcn `<Select>` with 20 language options
- "Auto-detect" is the first option

Both components are self-contained with their own labels, so the Settings row wrapper should use a simpler layout — just render the components within a section div, not duplicating the label pattern.

### What This Story Does NOT Include

- Does NOT modify MicrophoneSelect.tsx or LanguageSelect.tsx components
- Does NOT add onNavigate prop to DictationModePage (that's Story 3.2 if needed)
- Does NOT add microcopy to mode pages (that's Story 3.2)
- Does NOT move "What's New" link (that's Story 3.2)
- Does NOT delete any files (that's Story 4.1)

### Project Structure Notes

- **Modified file:** `src/pages/DictationModePage.tsx` (remove Audio Input section + imports)
- **Modified file:** `src/pages/SettingsPage.tsx` (add Audio Input section + imports, adjust animation delays)
- No new files needed
- All imports use `@/` path alias

### References

- [Source: src/pages/DictationModePage.tsx:4-5] — Imports to remove
- [Source: src/pages/DictationModePage.tsx:79-93] — Audio Input section to remove
- [Source: src/pages/SettingsPage.tsx:273-330] — Recording section (Audio Input goes after)
- [Source: src/pages/SettingsPage.tsx:332-502] — STT Provider section (Audio Input goes before)
- [Source: src/pages/SettingsPage.tsx:504-539] — Preferences section (animation delay bump)
- [Source: src/components/settings/MicrophoneSelect.tsx] — Component props and structure
- [Source: src/components/settings/LanguageSelect.tsx] — Component props and structure
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:439] — Section order: Hotkey Summary → Audio Input → STT → Preferences
- [Source: _bmad-output/planning-artifacts/epics.md:237-264] — Story 3.1 acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No errors encountered.

### Completion Notes List

- Removed MicrophoneSelect and LanguageSelect imports from DictationModePage
- Removed entire Audio Input card section from DictationModePage (lines 79-93)
- Added MicrophoneSelect and LanguageSelect imports to SettingsPage
- Added new "Audio Input" section to Settings > General between Recording and STT Provider
- Used settings-section-enter animation pattern with 0.06s delay
- Bumped STT Provider delay from 0.06s to 0.12s
- Bumped Preferences delay from 0.12s to 0.18s
- Code Mode toggle remains on DictationModePage (verified)
- STT Provider, API Key, Local Model, Preferences all preserved (verified)
- Build passes cleanly — all 3 Vite targets

### File List

- `src/pages/DictationModePage.tsx` (MODIFIED — removed Audio Input section + imports)
- `src/pages/SettingsPage.tsx` (MODIFIED — added Audio Input section + imports, adjusted animation delays)
