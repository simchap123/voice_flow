# Story 4.1: Remove Dead Pages, Imports, and Legacy Components

Status: done

## Story

As a developer,
I want unused code removed from the codebase,
So that the project is clean, maintainable, and doesn't confuse future development with orphaned files.

## Acceptance Criteria

1. **Given** the following page files exist but are never imported or routed to
   **When** the cleanup is performed
   **Then** `src/pages/SnippetsPage.tsx` is deleted
   **And** `src/pages/WhatsNewPage.tsx` is deleted
   **And** `src/pages/ThreeStepsPage.tsx` is deleted
   **And** `src/pages/DictationPage.tsx` is deleted

2. **Given** the following settings components exist but are not imported by any active page
   **When** the cleanup is performed
   **Then** these files are deleted: `ProvidersSection.tsx`, `AboutSection.tsx`, `EnhancementSection.tsx`, `SettingsNav.tsx`, `AIProcessingSection.tsx`, `AccountSection.tsx`, `PowerModesSection.tsx`, `RecordingSection.tsx`, `ThemeToggle.tsx`, `EmailReminder.tsx`

3. **Given** all deletions are complete
   **When** `npm run build` is executed
   **Then** the build succeeds with no missing import errors
   **And** no remaining file in `src/` imports any of the deleted files

## Tasks / Subtasks

- [x] Task 1: Delete dead pages (AC: 1)
  - [x] 1.1 Delete `src/pages/SnippetsPage.tsx`
  - [x] 1.2 Delete `src/pages/WhatsNewPage.tsx`
  - [x] 1.3 Delete `src/pages/ThreeStepsPage.tsx`
  - [x] 1.4 Delete `src/pages/DictationPage.tsx`
- [x] Task 2: Delete legacy settings components (AC: 2)
  - [x] 2.1 Delete `src/components/settings/ProvidersSection.tsx`
  - [x] 2.2 Delete `src/components/settings/AboutSection.tsx`
  - [x] 2.3 Delete `src/components/settings/EnhancementSection.tsx`
  - [x] 2.4 Delete `src/components/settings/SettingsNav.tsx`
  - [x] 2.5 Delete `src/components/settings/AIProcessingSection.tsx`
  - [x] 2.6 Delete `src/components/settings/AccountSection.tsx`
  - [x] 2.7 Delete `src/components/settings/PowerModesSection.tsx`
  - [x] 2.8 Delete `src/components/settings/RecordingSection.tsx`
  - [x] 2.9 Delete `src/components/settings/ThemeToggle.tsx`
  - [x] 2.10 Delete `src/components/settings/EmailReminder.tsx`
- [x] Task 3: Verify no remaining imports (AC: 3)
  - [x] 3.1 Grep for any imports of deleted files — zero matches
  - [x] 3.2 Run `npm run build` — zero errors

## Dev Notes

### Research Results

All 14 files confirmed to exist and are NOT imported by any active code:

**Dead Pages (4):**
- `SnippetsPage.tsx` — no imports, no routes
- `WhatsNewPage.tsx` — no imports, no routes
- `ThreeStepsPage.tsx` — no imports, no routes
- `DictationPage.tsx` — no imports, no routes (DictationModePage is the active page)

**Legacy Settings Components (10):**
- `ProvidersSection.tsx` — no imports
- `AboutSection.tsx` — no imports
- `EnhancementSection.tsx` — no imports
- `SettingsNav.tsx` — no imports
- `AIProcessingSection.tsx` — no imports
- `AccountSection.tsx` — no imports (imports EmailReminder internally, but both are deleted)
- `PowerModesSection.tsx` — no imports
- `RecordingSection.tsx` — no imports
- `ThemeToggle.tsx` — no imports
- `EmailReminder.tsx` — imported only by AccountSection.tsx (also being deleted)

### Cross-Reference Note

`EmailReminder.tsx` is imported by `AccountSection.tsx`. Since both are being deleted simultaneously, this creates no issue. There are no other cross-references between deleted files and active code.

### What This Story Does NOT Include

- Does NOT modify any active code files
- Does NOT remove active components (PromptsSection, HotkeyRecorder, etc. are still used)
- Does NOT change routing, navigation, or settings
- Just deletes 14 unused files

### Project Structure Notes

- **Deleted files:** 4 pages + 10 settings components = 14 files
- **Modified files:** None — pure deletion
- All deleted files are in `src/pages/` or `src/components/settings/`

### References

- [Source: _bmad-output/planning-artifacts/epics.md:299-325] — Story 4.1 acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No errors encountered.

### Completion Notes List

- Deleted 4 dead pages: SnippetsPage, WhatsNewPage, ThreeStepsPage, DictationPage
- Deleted 10 legacy settings components: ProvidersSection, AboutSection, EnhancementSection, SettingsNav, AIProcessingSection, AccountSection, PowerModesSection, RecordingSection, ThemeToggle, EmailReminder
- Grep confirmed zero remaining imports of any deleted file
- CSS bundle size reduced from 45.50 kB to 41.37 kB (dead component styles removed)
- Build passes cleanly — all 3 Vite targets

### File List

- `src/pages/SnippetsPage.tsx` (DELETED)
- `src/pages/WhatsNewPage.tsx` (DELETED)
- `src/pages/ThreeStepsPage.tsx` (DELETED)
- `src/pages/DictationPage.tsx` (DELETED)
- `src/components/settings/ProvidersSection.tsx` (DELETED)
- `src/components/settings/AboutSection.tsx` (DELETED)
- `src/components/settings/EnhancementSection.tsx` (DELETED)
- `src/components/settings/SettingsNav.tsx` (DELETED)
- `src/components/settings/AIProcessingSection.tsx` (DELETED)
- `src/components/settings/AccountSection.tsx` (DELETED)
- `src/components/settings/PowerModesSection.tsx` (DELETED)
- `src/components/settings/RecordingSection.tsx` (DELETED)
- `src/components/settings/ThemeToggle.tsx` (DELETED)
- `src/components/settings/EmailReminder.tsx` (DELETED)
