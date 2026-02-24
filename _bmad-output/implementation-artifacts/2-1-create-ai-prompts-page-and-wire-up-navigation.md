# Story 2.1: Create AI Prompts Page and Wire Up Navigation

Status: done

## Story

As a user,
I want a dedicated AI Prompts page accessible from the sidebar,
so that I can manage all my AI prompts in one focused location instead of hunting for them at the bottom of the AI Prompt Mode page.

## Acceptance Criteria

1. **Given** the app is open
   **When** the user looks at the sidebar
   **Then** an "AI Prompts" navigation item appears between the Modes section and the Settings footer
   **And** it uses an appropriate icon (e.g., MessageSquare or FileText)

2. **Given** the user clicks "AI Prompts" in the sidebar
   **When** the page loads
   **Then** a new AIPromptsPage renders with header "AI Prompts" and microcopy: "Prompts shape how AI processes your speech. The active prompt applies to both dictation cleanup and content generation."
   **And** the page displays the full PromptsSection content (active prompt, built-in prompts, custom prompts CRUD)

3. **Given** the AIPromptsPage is created
   **When** App.tsx routing is checked
   **Then** the `'ai-prompts'` route maps to `<AIPromptsPage />`
   **And** the dead `DictationPage` import is removed from App.tsx

## Tasks / Subtasks

- [x] Task 1: Create AIPromptsPage component (AC: 2)
  - [x] 1.1 Create `src/pages/AIPromptsPage.tsx` with ScrollArea wrapper, page header, and PromptsSection
  - [x] 1.2 Import PromptsSection from `@/components/settings/PromptsSection`
  - [x] 1.3 Use established page layout pattern: `page-enter p-6 space-y-3 max-w-[560px]`
  - [x] 1.4 Header: `text-[16px] font-bold tracking-tight` title + `text-[11px] text-muted-foreground/50` microcopy
- [x] Task 2: Add sidebar navigation item (AC: 1)
  - [x] 2.1 Add `ai-prompts` nav item to Sidebar.tsx — positioned between modeNav section and Settings footer
  - [x] 2.2 Use `FileText` icon from lucide-react (distinguishes from mode pages)
  - [x] 2.3 Add "AI Prompts" separator label above the nav item (like "Modes" separator)
- [x] Task 3: Wire up App.tsx routing (AC: 3)
  - [x] 3.1 Add `case 'ai-prompts': return <AIPromptsPage />` to renderPage switch
  - [x] 3.2 Add `import { AIPromptsPage } from '@/pages/AIPromptsPage'`
  - [x] 3.3 Remove dead `import { DictationPage } from '@/pages/DictationPage'` (line 5)
- [x] Task 4: Verify build succeeds (AC: all)
  - [x] 4.1 Run `npm run build` — zero errors

## Dev Notes

### Previous Story Intelligence (Epic 1)

Epic 1 (Stories 1.1 + 1.2) completed successfully. Key learnings:
- `onNavigate` prop was threaded from App.tsx → SettingsPage for HotkeyBadge navigation. The same `setCurrentPage` mechanism powers ALL page navigation.
- Code review caught `onNavigate` typed as optional when de facto required → made required. Apply this pattern: if a prop is always provided, type it as required.
- File naming: kebab-case (`hotkey-badge.tsx`, not `HotkeyBadge.tsx`)
- Build must pass all 3 Vite targets (renderer, main, preload)

### Navigation Architecture (CRITICAL)

Page routing is simple string-based switching in `App.tsx:51-58`:

```typescript
const renderPage = () => {
  switch (currentPage) {
    case 'history': return <HistoryPage />
    case 'settings': return <SettingsPage onNavigate={setCurrentPage} />
    case 'dictation': return <DictationModePage />
    case 'ai-prompt': return <AIPromptModePage />
    default: return <HistoryPage />
  }
}
```

`currentPage` state lives in `MainApp` (line 16). Sidebar receives `currentPage` + `onNavigate={setCurrentPage}` (line 65).

### Sidebar Structure (CRITICAL — exact insertion point)

`src/components/layout/Sidebar.tsx` has this structure:

```
<nav>
  mainNav loop (History)         ← lines 46-60
  "Modes" separator              ← lines 63-65
  modeNav loop (Dictation, AI Prompt) ← lines 67-81
</nav>
<footer>                         ← lines 85-132
  Settings button
  User profile chip
</footer>
```

The "AI Prompts" nav item must go BETWEEN the `</nav>` and the footer. There are two approaches:

**Approach A (Recommended): Add a new nav section inside the `<nav>` element after modeNav**

Add a new separator "Prompts" (or just the item without separator) after the modeNav loop, before `</nav>` closes at line 82. This keeps all navigation inside the `<nav>` element.

```tsx
{/* AI Prompts */}
<p className="mt-4 mb-1 px-3 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">
  Prompts
</p>
<button
  onClick={() => onNavigate('ai-prompts')}
  className={cn(
    'flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150',
    currentPage === 'ai-prompts'
      ? 'bg-primary text-white shadow-sm'
      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
  )}
>
  <FileText className="h-[15px] w-[15px] shrink-0" />
  AI Prompts
</button>
```

Insert this block at `Sidebar.tsx:81` — after the modeNav loop's closing `)}` and before `</nav>`.

### Page Layout Pattern (copy exactly)

All mode/content pages follow the same wrapper pattern. From `AIPromptModePage.tsx`:

```tsx
<ScrollArea className="h-full">
  <div className="page-enter p-6 space-y-3 max-w-[560px]">
    <div className="mb-2">
      <h2 className="text-[16px] font-bold tracking-tight">AI Prompts</h2>
      <p className="text-[11px] text-muted-foreground/50">
        Prompts shape how AI processes your speech. The active prompt applies to both dictation cleanup and content generation.
      </p>
    </div>

    <PromptsSection />
  </div>
</ScrollArea>
```

### PromptsSection Component

`src/components/settings/PromptsSection.tsx` — self-contained component that manages:
- Active prompt display and selection
- Built-in predefined prompts list (from `@/lib/cleanup/predefined-prompts`)
- Custom prompts CRUD (create/edit/delete)
- Uses `useSettings()` internally for `activePromptId`
- Uses `window.electronAPI.getCustomPrompts()` / `setCustomPrompts()` for persistence

**NO props needed** — PromptsSection is a zero-prop component that manages its own state. Just render `<PromptsSection />`.

### Dead Import: DictationPage

`App.tsx:5` has `import { DictationPage } from '@/pages/DictationPage'` — this is UNUSED. `DictationPage` is never referenced in the renderPage switch or anywhere else in App.tsx. The switch uses `DictationModePage` (line 55), not `DictationPage`. Safe to remove.

`DictationPage.tsx` itself is a legacy file — it's a full dictation UI with mic button, waveform, etc. NOT the same as `DictationModePage.tsx` (which is the mode settings page). The file itself should NOT be deleted (that's Story 4.1 scope) — just remove the dead import from App.tsx.

### Icon Choice

The UX spec suggests `MessageSquare` or `FileText`. Use `FileText` because:
- `MessageSquare` is already used by Dictation mode in the sidebar (line 16)
- `FileText` clearly represents "prompts/templates" — distinct from modes
- Already available in the lucide-react import at Sidebar.tsx line 2 (just add `FileText` to the import)

### Route ID

Use `'ai-prompts'` (with hyphen) as the route ID. This follows the existing pattern where `'ai-prompt'` is the mode page. The `-s` suffix distinguishes the prompts management page from the mode page.

### What This Story Does NOT Include

- Does NOT remove PromptsSection from AIPromptModePage (that's Story 2.2)
- Does NOT add "Manage AI Prompts →" link to AIPromptModePage (that's Story 2.2)
- Does NOT modify PromptsSection component itself
- Does NOT delete DictationPage.tsx file (that's Story 4.1)
- Does NOT add any new props to existing components

### AIPromptsPage Does NOT Need onNavigate

Unlike SettingsPage (which uses onNavigate for HotkeyBadge "Edit →" links), the new AIPromptsPage just renders PromptsSection which is self-contained. No navigation props needed — render it with zero props like `<AIPromptsPage />`.

### Project Structure Notes

- **New file:** `src/pages/AIPromptsPage.tsx` (kebab-case, following project convention)
- **Modified file:** `src/components/layout/Sidebar.tsx` (add AI Prompts nav item + import FileText)
- **Modified file:** `src/App.tsx` (add route case + import, remove dead DictationPage import)
- All imports use `@/` path alias
- ESM only — no `require()`

### References

- [Source: src/App.tsx:51-58] — renderPage switch (add ai-prompts case)
- [Source: src/App.tsx:5] — Dead DictationPage import to remove
- [Source: src/components/layout/Sidebar.tsx:67-81] — modeNav section (insert AI Prompts after)
- [Source: src/components/layout/Sidebar.tsx:2] — lucide-react imports (add FileText)
- [Source: src/pages/AIPromptModePage.tsx:134] — PromptsSection usage (reference pattern)
- [Source: src/components/settings/PromptsSection.tsx:10] — Zero-prop component, self-contained
- [Source: _bmad-output/planning-artifacts/epics.md] — Story 2.1 acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:426-437] — Sidebar update + AI Prompts page layout

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No errors encountered.

### Completion Notes List

- Created AIPromptsPage component wrapping PromptsSection with proper page layout pattern
- Added "AI Prompts" nav item to Sidebar with FileText icon, under new "Prompts" separator section
- Added `'ai-prompts'` route to App.tsx renderPage switch
- Removed dead `DictationPage` import from App.tsx (unused since mode pages were introduced)
- Build passes cleanly — all 3 Vite targets (renderer, main, preload)

### File List

- `src/pages/AIPromptsPage.tsx` (NEW — AI Prompts page component)
- `src/components/layout/Sidebar.tsx` (MODIFIED — added FileText import, AI Prompts nav section)
- `src/App.tsx` (MODIFIED — added AIPromptsPage import + route, removed dead DictationPage import)
