# Story 2.2: Update AI Prompt Mode Page to Link to AI Prompts

Status: done

## Story

As a user,
I want the AI Prompt Mode page to link me to the dedicated AI Prompts page,
so that I can quickly navigate to prompt management without the prompts list cluttering the mode page.

## Acceptance Criteria

1. **Given** the AI Prompt Mode page is open
   **When** it renders
   **Then** the PromptsSection component is no longer displayed inline on this page

2. **Given** the AI Prompt Mode page is open
   **When** the user looks at the bottom of the page (after the Context section)
   **Then** a "Manage AI Prompts →" link is visible, styled with `text-primary text-sm` and hover underline

3. **Given** the user clicks "Manage AI Prompts →"
   **When** navigation completes
   **Then** the AI Prompts page loads with the full prompt management interface

## Tasks / Subtasks

- [x] Task 1: Remove PromptsSection from AIPromptModePage (AC: 1)
  - [x] 1.1 Remove `import { PromptsSection } from '@/components/settings/PromptsSection'` (line 7)
  - [x] 1.2 Remove `<PromptsSection />` render (line 134)
  - [x] 1.3 Remove the `{/* Prompts */}` comment (line 133)
- [x] Task 2: Add onNavigate prop to AIPromptModePage (AC: 3)
  - [x] 2.1 Create `AIPromptModePageProps` interface with required `onNavigate: (page: string) => void`
  - [x] 2.2 Update function signature to accept `{ onNavigate }` prop
  - [x] 2.3 Update App.tsx to pass `onNavigate={setCurrentPage}` to AIPromptModePage
- [x] Task 3: Add "Manage AI Prompts →" navigation link (AC: 2, 3)
  - [x] 3.1 Add a `<button>` element after the Context section with text "Manage AI Prompts →"
  - [x] 3.2 Style with `text-primary text-sm hover:underline transition-colors`
  - [x] 3.3 Wire `onClick` to call `onNavigate('ai-prompts')`
  - [x] 3.4 Add `type="button"` attribute (lesson from Story 1.1 review)
  - [x] 3.5 Add `aria-label="Manage AI Prompts"` for accessibility
- [x] Task 4: Verify build succeeds (AC: all)
  - [x] 4.1 Run `npm run build` — zero errors

## Dev Notes

### Previous Story Intelligence (Story 2.1)

Story 2.1 completed successfully:
- `AIPromptsPage` exists at `src/pages/AIPromptsPage.tsx` — wraps PromptsSection with page header
- Route `'ai-prompts'` is wired in `App.tsx:57`
- Sidebar has "AI Prompts" nav item under "Prompts" separator
- Code review removed unused `useState`/`useEffect` imports from Sidebar, added `type="button"`
- Route ID is `'ai-prompts'` (with trailing 's', distinct from `'ai-prompt'` mode page)

### Navigation Plumbing Required (CRITICAL)

`AIPromptModePage` currently receives NO props. In `App.tsx:56`:
```typescript
case 'ai-prompt': return <AIPromptModePage />
```

To navigate to the AI Prompts page, we need `onNavigate`. Follow the same pattern established in Story 1.1 for SettingsPage:

1. Create interface: `interface AIPromptModePageProps { onNavigate: (page: string) => void }`
2. Update function: `export function AIPromptModePage({ onNavigate }: AIPromptModePageProps)`
3. Update App.tsx: `case 'ai-prompt': return <AIPromptModePage onNavigate={setCurrentPage} />`

**IMPORTANT:** Make `onNavigate` REQUIRED (not optional). Lesson from Story 1.1 code review — optional props that are always provided lead to non-null assertions.

### Exact Code to Remove

```
Line 7:  import { PromptsSection } from '@/components/settings/PromptsSection'
Line 133: {/* Prompts */}
Line 134: <PromptsSection />
```

After removal, the page structure becomes:
```
Header → Hotkey section → Generation section → Context section → "Manage AI Prompts →" link
```

### "Manage AI Prompts →" Link Pattern

From UX spec: Navigation links use `text-primary text-sm` with hover underline. Following the HotkeyBadge "Edit →" pattern but as a standalone link at the bottom of the page.

```tsx
<button
  type="button"
  onClick={() => onNavigate('ai-prompts')}
  aria-label="Manage AI Prompts"
  className="text-primary text-sm hover:underline transition-colors"
>
  Manage AI Prompts →
</button>
```

Place this AFTER the Context section's closing `</div>` (line 131), BEFORE the page wrapper's closing `</div>` (currently line 135).

### What This Story Does NOT Include

- Does NOT modify PromptsSection.tsx component (still used by AIPromptsPage)
- Does NOT delete PromptsSection.tsx file
- Does NOT modify AIPromptsPage.tsx (created in Story 2.1)
- Does NOT modify Sidebar.tsx
- Does NOT add microcopy to the mode page (that's Story 3.2)

### DictationModePage Also Needs onNavigate Eventually

`DictationModePage` currently has no `onNavigate` prop either. Story 3.2 may need it for cross-page links. This story only adds it to AIPromptModePage.

### Project Structure Notes

- **Modified file:** `src/pages/AIPromptModePage.tsx` (remove PromptsSection, add onNavigate prop, add link)
- **Modified file:** `src/App.tsx` (pass onNavigate to AIPromptModePage)
- No new files needed
- All imports use `@/` path alias

### References

- [Source: src/pages/AIPromptModePage.tsx:7] — PromptsSection import to remove
- [Source: src/pages/AIPromptModePage.tsx:133-134] — PromptsSection render to remove
- [Source: src/App.tsx:56] — AIPromptModePage rendered with no props (needs onNavigate)
- [Source: src/pages/AIPromptsPage.tsx] — Destination page (Story 2.1, route 'ai-prompts')
- [Source: _bmad-output/planning-artifacts/epics.md] — Story 2.2 acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:583-593] — Navigation link pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No errors encountered.

### Completion Notes List

- Removed PromptsSection import and render from AIPromptModePage
- Added AIPromptModePageProps interface with required onNavigate prop
- Updated App.tsx to pass onNavigate={setCurrentPage} to AIPromptModePage
- Added "Manage AI Prompts →" button after Context section with text-primary text-sm styling
- Button has type="button", aria-label, hover:underline transition
- Build passes cleanly — all 3 Vite targets

### File List

- `src/pages/AIPromptModePage.tsx` (MODIFIED — removed PromptsSection, added onNavigate prop, added link)
- `src/App.tsx` (MODIFIED — pass onNavigate to AIPromptModePage)
