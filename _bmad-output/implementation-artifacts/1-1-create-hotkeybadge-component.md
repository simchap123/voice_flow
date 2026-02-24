# Story 1.1: Create HotkeyBadge Component

Status: done

## Story

As a user,
I want to see my hotkey assignments displayed as clear, read-only badges,
so that I can quickly identify which keys are assigned without confusing them with editable controls.

## Acceptance Criteria

1. **Given** the HotkeyBadge component is rendered with `label`, `hotkey`, and `editPage` props
   **When** it appears on screen
   **Then** it displays: the label text, a `<kbd>` element showing the hotkey value, and an "Edit →" text link
   **And** the `<kbd>` element is styled with `bg-muted text-muted-foreground text-xs font-mono rounded px-2 py-0.5`
   **And** the `<kbd>` element is visually distinct from the interactive HotkeyRecorder (no border, no hover/focus states)

2. **Given** a HotkeyBadge with `editPage="dictation"`
   **When** the user clicks the "Edit →" link
   **Then** the app navigates to the Dictation mode page
   **And** the link has `aria-label="Edit {label} in {editPage} settings"`

3. **Given** a HotkeyBadge with no hotkey assigned (empty string)
   **When** it renders
   **Then** it displays "Not set" in place of the `<kbd>` badge

## Tasks / Subtasks

- [x] Task 1: Create `src/components/settings/hotkey-badge.tsx` (AC: 1, 2, 3)
  - [x] 1.1 Define `HotkeyBadgeProps` interface with `label`, `hotkey`, `editPage`, `onNavigate`
  - [x] 1.2 Implement `<kbd>` badge rendering with compound hotkey splitting (`+` separator)
  - [x] 1.3 Implement display name mapping (reuse DISPLAY_NAMES pattern from HotkeyRecorder)
  - [x] 1.4 Implement empty state ("Not set" text)
  - [x] 1.5 Implement "Edit →" link with `aria-label` and `onNavigate` callback
  - [x] 1.6 Verify visual distinction from HotkeyRecorder
- [x] Task 2: Wire up navigation in App.tsx (AC: 2)
  - [x] 2.1 Pass `onNavigate={setCurrentPage}` prop to `<SettingsPage>` in `renderPage()`
  - [x] 2.2 Update SettingsPage component signature to accept `onNavigate` prop
- [x] Task 3: Verify build succeeds (AC: all)
  - [x] 3.1 Run `npm run build` — zero errors

## Dev Notes

### Critical: Navigation Plumbing Required

**SettingsPage currently has NO navigation prop.** In `App.tsx:54`, SettingsPage is rendered as `<SettingsPage />` with no props. The HotkeyBadge needs to navigate to mode pages, so you MUST:

1. Add `onNavigate` prop to SettingsPage's interface
2. Pass `setCurrentPage` from App.tsx: `<SettingsPage onNavigate={setCurrentPage} />`
3. Thread `onNavigate` through to HotkeyBadge

This is the ONLY way — there is no React Context or router for page navigation. Navigation is prop-drilled from `MainApp` → `Sidebar`/`SettingsPage`.

**Reference:** `src/App.tsx:51-59` (renderPage switch), `src/App.tsx:65` (Sidebar gets `onNavigate={setCurrentPage}`)

### Display Name Mapping

HotkeyRecorder has `DISPLAY_NAMES` and `displayHotkey()` at `src/components/settings/HotkeyRecorder.tsx:36-48`. HotkeyBadge needs the same mapping. Options:

- **Recommended for Story 1.1:** Duplicate the small mapping inline in `hotkey-badge.tsx`. It's only 10 lines and avoids modifying HotkeyRecorder (separate story scope).
- **NOT recommended:** Creating a shared utility file. That's scope creep — can be refactored in a later story.

```typescript
const isWindows = navigator.userAgent.includes('Windows')
const DISPLAY_NAMES: Record<string, string> = {
  'RightAlt': 'Right Alt',
  'LeftAlt': 'Left Alt',
  'RightControl': 'Right Ctrl',
  'LeftControl': 'Left Ctrl',
  'RightShift': 'Right Shift',
  'LeftShift': 'Left Shift',
  'Super': isWindows ? 'Windows' : 'Super',
}
function displayHotkey(hotkey: string): string {
  return DISPLAY_NAMES[hotkey] || hotkey
}
```

### Exact Styling Comparison (Read-Only vs Interactive)

| Property | HotkeyBadge (read-only) | HotkeyRecorder (interactive) |
|----------|------------------------|------------------------------|
| Border | **None** | `border border-border/40` (idle), `border-2 border-primary/50` (recording) |
| Background | `bg-muted` (solid) | `bg-muted/30` (translucent idle), `bg-primary/5` (recording) |
| Text color | `text-muted-foreground` | default foreground |
| Font | `text-xs font-mono` | `text-[10px] font-bold` |
| Padding | `px-2 py-0.5` | `px-1.5 py-0.5` (kbd), `px-3 py-1.5` (container) |
| Hover | **None** | `hover:border-primary/40 hover:bg-primary/5` |
| Cursor | Default | `cursor-pointer` |
| Interaction | None — purely decorative display | Click to record, keydown capture |

**NFR8:** `<kbd>` badge must be visually distinct from HotkeyRecorder.
**NFR9:** Read-only summaries must NOT look like editable controls. No disabled inputs — use `<kbd>` badges.

### Component Props

```typescript
interface HotkeyBadgeProps {
  label: string              // "Hold-to-Record", "Toggle Recording", "AI Prompt"
  hotkey: string             // "RightAlt", "Control+Alt+S", or "" (empty = not set)
  editPage: string           // "dictation" | "ai-prompt"
  onNavigate: (page: string) => void  // Calls setCurrentPage from App.tsx
}
```

### Settings Row Layout Pattern

Follow the existing 2-column pattern from SettingsPage (`src/pages/SettingsPage.tsx:275-293`):

```tsx
<div className="flex items-start gap-5 py-3">
  <div className="w-[160px] shrink-0">
    <div className="text-[13px] font-medium text-muted-foreground flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground/50" />
      Label text
    </div>
  </div>
  <div className="flex-1">
    {/* HotkeyBadge goes here */}
  </div>
</div>
```

The HotkeyBadge itself should render just the kbd + "Edit →" link. The label column with icon is provided by the parent (SettingsPage). This matches how HotkeyRecorder is currently used — the label is outside the component.

### Semantic HTML Requirements

- **NFR4:** MUST use `<kbd>` element (not `<span>` or `<div>`)
- **NFR3:** "Edit →" link must have `aria-label="Edit {label} in {editPage} settings"`
- The "Edit →" element should be a `<button>` (not `<a>`) since it triggers in-app navigation, not a URL

### "Edit →" Link Styling

From UX spec: `text-primary text-sm hover:underline`

But to match the existing SettingsPage scale (which uses `text-[11px]` to `text-[13px]`), use:
```
text-primary text-[11px] hover:underline transition-colors
```

### Page Name Mapping for aria-label

```typescript
const PAGE_NAMES: Record<string, string> = {
  'dictation': 'Dictation',
  'ai-prompt': 'AI Prompt',
}
// aria-label={`Edit ${label} in ${PAGE_NAMES[editPage]} settings`}
```

### What This Story Does NOT Include

Story 1.1 creates the component only. It does NOT:
- Replace HotkeyRecorders in SettingsPage (that's Story 1.2)
- Add Toggle Recording badge to Settings (that's Story 1.2)
- Move any settings between pages (that's Epic 3)
- Create the AI Prompts page (that's Epic 2)

The `onNavigate` plumbing in App.tsx IS included because the component is unusable without it, and Story 1.2 will immediately need it.

### Project Structure Notes

- **New file:** `src/components/settings/hotkey-badge.tsx` (kebab-case per project convention)
- **Modified file:** `src/App.tsx` (add onNavigate prop to SettingsPage)
- **Modified file:** `src/pages/SettingsPage.tsx` (accept onNavigate prop — minimal change, just add to function signature)
- All imports use `@/` path alias
- ESM only — no `require()`

### References

- [Source: src/components/settings/HotkeyRecorder.tsx] — Display names (lines 36-48), kbd styling (line 182), interactive styling (lines 165, 176)
- [Source: src/pages/SettingsPage.tsx:269-315] — Current Recording section layout pattern
- [Source: src/App.tsx:51-59] — renderPage switch (SettingsPage has no props currently)
- [Source: src/App.tsx:65] — Sidebar receives onNavigate={setCurrentPage}
- [Source: _bmad-output/planning-artifacts/epics.md:137-159] — Story 1.1 acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — HotkeyBadge visual spec, NFR3/NFR4/NFR8/NFR9
- [Source: docs/ARCHITECTURE.md] — ESM requirement, path alias, file naming conventions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No errors encountered during implementation.

### Completion Notes List

- Created HotkeyBadge component with all 4 props (label, hotkey, editPage, onNavigate)
- Duplicated DISPLAY_NAMES + displayHotkey() from HotkeyRecorder (10 lines, avoids scope creep)
- Compound hotkeys split on `+` and each part rendered in separate `<kbd>` elements
- Empty hotkey shows "Not set" in muted text
- "Edit →" button uses `aria-label` with PAGE_NAMES mapping for accessibility (NFR3)
- Semantic `<kbd>` elements used throughout (NFR4)
- No border, no hover/focus on `<kbd>` — visually distinct from HotkeyRecorder (NFR8/NFR9)
- SettingsPage now accepts optional `onNavigate` prop (backward-compatible)
- App.tsx passes `setCurrentPage` to SettingsPage for navigation plumbing
- Build passes cleanly (renderer, main, preload — all 3 Vite builds)

### File List

- `src/components/settings/hotkey-badge.tsx` (NEW)
- `src/App.tsx` (MODIFIED — added onNavigate prop to SettingsPage)
- `src/pages/SettingsPage.tsx` (MODIFIED — added onNavigate prop to function signature)
