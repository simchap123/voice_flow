---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - docs/PRD-v3.md
  - docs/ARCHITECTURE.md
  - docs/BACKEND_ARCHITECTURE.md
---

# VoxGen - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for VoxGen's **Settings UI Reorganization**, decomposing the requirements from the UX Design Specification, PRD, and Architecture into implementable stories. The scope is eliminating setting duplication, fixing misplaced controls, creating the AI Prompts page, and cleaning up dead code.

## Requirements Inventory

### Functional Requirements

FR1: Each setting must be editable in exactly one location — no duplicate edit points across the app
FR2: Hold-to-Record hotkey must be editable only on the Dictation page; Settings > General must show a read-only HotkeyBadge with "Edit →" link
FR3: Toggle Recording hotkey must be editable only on the Dictation page; Settings > General must show a read-only HotkeyBadge (new addition for discoverability)
FR4: AI Prompt hotkey must be editable only on the AI Prompt page; Settings > General must show a read-only HotkeyBadge with "Edit →" link
FR5: Each read-only HotkeyBadge must include an "Edit →" link that navigates to the canonical edit page (mode page)
FR6: MicrophoneSelect must move from Dictation page to Settings > General > Audio Input section
FR7: LanguageSelect must move from Dictation page to Settings > General > Audio Input section
FR8: A new AI Prompts page must be created as a dedicated sidebar navigation item
FR9: PromptsSection must move from AI Prompt Mode page to the new AI Prompts page
FR10: AI Prompt Mode page must include a "Manage AI Prompts →" navigation link to the AI Prompts page
FR11: "What's New" link must move from Settings > Account header to Settings > Notifications > Updates section
FR12: Sidebar must add "AI Prompts" as a new navigation item between Modes section and Settings footer
FR13: App.tsx must add a route for the new AI Prompts page and remove the dead DictationPage import
FR14: Each mode page (Dictation, AI Prompt) must display microcopy text explaining the mode's purpose
FR15: A HotkeyBadge component must be created: read-only `<kbd>` badge + "Edit →" link with navigation
FR16: Dead code pages must be removed: SnippetsPage.tsx, WhatsNewPage.tsx, ThreeStepsPage.tsx
FR17: Legacy unused settings components must be removed (ProvidersSection, AboutSection, EnhancementSection, SettingsNav, AIProcessingSection, AccountSection, PowerModesSection, RecordingSection, ThemeToggle, EmailReminder)
FR18: Code Mode toggle must remain on the Dictation page (no change)
FR19: STT Provider selector, API Key dialog, and Local Model management must remain in Settings > General (no change)
FR20: Auto-paste and AI Cleanup toggles must remain in Settings > General > Preferences (no change)
FR21: Generation settings (keyword triggers, prompt refinement, output length) must remain on AI Prompt page (no change)
FR22: Context settings (clipboard context, active window context) must remain on AI Prompt page (no change)
FR23: Sound effects, Error alerts, Auto-update, and Version check must remain in Settings > Notifications (no change)
FR24: License management (LicenseInput) must remain in Settings > Account (no change)
FR25: DevTools (admin-only, gated by ADMIN_EMAIL) must remain in Settings > Account (no change)
FR26: API Key Dialog modal (ProviderApiKeyInput) must be preserved in Settings General tab
FR27: isManagedMode "VoxGen Cloud" message must be preserved in STT Provider section

### NonFunctional Requirements

NFR1: No functionality loss — all 30 active UI elements must be preserved during reorganization
NFR2: WCAG AA accessibility maintained (existing Radix/shadcn-ui coverage)
NFR3: HotkeyBadge "Edit →" link must have `aria-label="Edit {hotkey name} in {page name} settings"`
NFR4: HotkeyBadge must use semantic `<kbd>` HTML element (not `<span>`)
NFR5: Tab order must be verified after moving components between pages
NFR6: Settings auto-save behavior preserved — no explicit "Save" button needed
NFR7: Existing visual design system used throughout (Tailwind 3.4 + shadcn/ui + HSL CSS variables) — no new design system
NFR8: `<kbd>` badge must be visually distinct from interactive HotkeyRecorder (different background, no hover/focus states)
NFR9: Read-only summaries must NOT look like editable controls (no disabled inputs — use `<kbd>` badges)
NFR10: Settings tabs must have roughly balanced content density (no tab >30% emptier than others)

### Additional Requirements

**From Architecture:**
- IPC pattern: Any new IPC channels require changes to 3 files (ipc-handlers.ts, preload/index.ts, preload/types.ts)
- ESM compatibility: No `require()` — ESM imports only (`"type": "module"` in package.json is load-bearing)
- Path alias: `@/` → `src/` must be used for all imports
- File naming: kebab-case for files (e.g., `hotkey-badge.tsx`), PascalCase for components
- No new dependencies needed — reorganization uses existing shadcn/ui components + Tailwind

**From UX Design Specification:**
- Section spacing: 24px between sections (`space-y-6`), 12px between setting rows (`space-y-3`)
- Page header pattern: title (`text-lg font-semibold`) + description (`text-sm text-muted-foreground mt-1`) + `mb-6` gap
- Navigation links: `text-primary text-sm` with hover underline
- HotkeyBadge styling: `<kbd className="bg-muted text-muted-foreground text-xs font-mono rounded px-2 py-0.5">`
- Setting rows: label + control on one line (`flex justify-between items-center`)
- Max 2 clicks to reach any setting (sidebar → page, or sidebar → Settings tab)
- Microcopy text per mode page:
  - Dictation: "Press a hotkey to record your voice. Speech is transcribed and typed into the active app."
  - AI Prompt: "Speak a prompt to generate AI content. Use keyword triggers to activate generation."
  - AI Prompts: "Prompts shape how AI processes your speech. The active prompt applies to both dictation cleanup and content generation."

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Single editable location per setting |
| FR2 | Epic 1 | Hold-to-Record hotkey: edit on Dictation, read-only in Settings |
| FR3 | Epic 1 | Toggle Recording hotkey: edit on Dictation, read-only in Settings |
| FR4 | Epic 1 | AI Prompt hotkey: edit on AI Prompt page, read-only in Settings |
| FR5 | Epic 1 | HotkeyBadge "Edit →" links navigate to mode pages |
| FR6 | Epic 3 | MicrophoneSelect moves to Settings > General |
| FR7 | Epic 3 | LanguageSelect moves to Settings > General |
| FR8 | Epic 2 | New AI Prompts page created |
| FR9 | Epic 2 | PromptsSection moves to AI Prompts page |
| FR10 | Epic 2 | "Manage AI Prompts →" link on AI Prompt Mode page |
| FR11 | Epic 3 | "What's New" moves to Notifications > Updates |
| FR12 | Epic 2 | Sidebar adds AI Prompts nav item |
| FR13 | Epic 2 | App.tsx adds AI Prompts route |
| FR14 | Epic 3 | Mode pages get microcopy descriptions |
| FR15 | Epic 1 | HotkeyBadge component created |
| FR16 | Epic 4 | Dead pages removed |
| FR17 | Epic 4 | Legacy components removed |
| FR18 | Epic 3 | Code Mode stays on Dictation (verified) |
| FR19 | Epic 3 | STT/API Key/Local Model stays in Settings > General (verified) |
| FR20 | Epic 3 | Auto-paste/AI Cleanup stays in Preferences (verified) |
| FR21 | Epic 3 | Generation settings stay on AI Prompt page (verified) |
| FR22 | Epic 3 | Context settings stay on AI Prompt page (verified) |
| FR23 | Epic 3 | Sound/Error/Update stays in Notifications (verified) |
| FR24 | Epic 3 | License stays in Account (verified) |
| FR25 | Epic 3 | DevTools stays in Account (verified) |
| FR26 | Epic 3 | API Key Dialog preserved (verified) |
| FR27 | Epic 3 | isManagedMode message preserved (verified) |

## Epic List

### Epic 1: Single Source of Truth for Hotkeys
Users can see all hotkey assignments at a glance in Settings and edit each hotkey in exactly one place — its mode page. No more confusion about which edit location is canonical.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR15

### Epic 2: Dedicated AI Prompts Page
AI prompt management becomes a first-class feature with its own sidebar item and dedicated page, accessible from anywhere — not buried at the bottom of the AI Prompt Mode page.
**FRs covered:** FR8, FR9, FR10, FR12, FR13

### Epic 3: Streamlined Mode Pages & Balanced Settings
Mode pages become focused, self-documenting configuration hubs. Settings tabs get balanced density with logically grouped controls. Audio Input lives in Settings where it applies to all modes.
**FRs covered:** FR6, FR7, FR11, FR14, FR18-FR27
**Depends on:** Epic 1

### Epic 4: Codebase Cleanup
Remove dead code: unused pages, orphaned imports, and legacy components that add confusion and bloat.
**FRs covered:** FR16, FR17

## Epic 1: Single Source of Truth for Hotkeys

Users can see all hotkey assignments at a glance in Settings and edit each hotkey in exactly one place — its mode page. No more confusion about which edit location is canonical.

### Story 1.1: Create HotkeyBadge Component

As a user,
I want to see my hotkey assignments displayed as clear, read-only badges,
So that I can quickly identify which keys are assigned without confusing them with editable controls.

**Acceptance Criteria:**

**Given** the HotkeyBadge component is rendered with a `label`, `hotkey`, and `editPage` prop
**When** it appears on screen
**Then** it displays: the label text, a `<kbd>` element showing the hotkey value, and an "Edit →" text link
**And** the `<kbd>` element is styled with `bg-muted text-muted-foreground text-xs font-mono rounded px-2 py-0.5`
**And** the `<kbd>` element is visually distinct from the interactive HotkeyRecorder (no border, no hover/focus states)

**Given** a HotkeyBadge with `editPage="dictation"`
**When** the user clicks the "Edit →" link
**Then** the app navigates to the Dictation mode page
**And** the link has `aria-label="Edit {label} in {editPage} settings"`

**Given** a HotkeyBadge with no hotkey assigned (empty string)
**When** it renders
**Then** it displays "Not set" in place of the `<kbd>` badge

### Story 1.2: Replace Hotkey Editors in Settings with Read-Only Badges

As a user,
I want the Settings > General page to show my hotkeys as a compact read-only summary with links to edit them,
So that I can see all my hotkeys at a glance and know exactly where to change each one.

**Acceptance Criteria:**

**Given** the Settings > General tab is open
**When** the Recording section renders
**Then** it displays 3 HotkeyBadge components: "Hold-to-Record" (linking to Dictation), "Toggle Recording" (linking to Dictation), and "AI Prompt" (linking to AI Prompt)
**And** the HotkeyRecorder components previously in this section are removed
**And** each badge shows the current hotkey value from settings (holdHotkey, toggleHotkey, promptHotkey)

**Given** a user clicks "Edit →" on the Hold-to-Record badge in Settings
**When** the navigation completes
**Then** the Dictation mode page loads and the HotkeyRecorder for Hold-to-Record is visible and editable

**Given** the holdHotkey is changed on the Dictation mode page
**When** the user navigates back to Settings > General
**Then** the Hold-to-Record HotkeyBadge shows the updated hotkey value

**Given** the Toggle Recording hotkey was not previously shown in Settings > General
**When** Settings > General renders after this change
**Then** a new HotkeyBadge row for Toggle Recording appears (added for discoverability)

## Epic 2: Dedicated AI Prompts Page

AI prompt management becomes a first-class feature with its own sidebar item and dedicated page, accessible from anywhere — not buried at the bottom of the AI Prompt Mode page.

### Story 2.1: Create AI Prompts Page and Wire Up Navigation

As a user,
I want a dedicated AI Prompts page accessible from the sidebar,
So that I can manage all my AI prompts in one focused location instead of hunting for them at the bottom of the AI Prompt Mode page.

**Acceptance Criteria:**

**Given** the app is open
**When** the user looks at the sidebar
**Then** an "AI Prompts" navigation item appears between the Modes section and the Settings footer
**And** it uses an appropriate icon (e.g., MessageSquare or FileText)

**Given** the user clicks "AI Prompts" in the sidebar
**When** the page loads
**Then** a new AIPromptsPage renders with header "AI Prompts" and microcopy: "Prompts shape how AI processes your speech. The active prompt applies to both dictation cleanup and content generation."
**And** the page displays the full PromptsSection content (active prompt, built-in prompts, custom prompts CRUD)

**Given** the AIPromptsPage is created
**When** App.tsx routing is checked
**Then** the `'ai-prompts'` route maps to `<AIPromptsPage />`
**And** the dead `DictationPage` import is removed from App.tsx

### Story 2.2: Update AI Prompt Mode Page to Link to AI Prompts

As a user,
I want the AI Prompt Mode page to link me to the dedicated AI Prompts page,
So that I can quickly navigate to prompt management without the prompts list cluttering the mode page.

**Acceptance Criteria:**

**Given** the AI Prompt Mode page is open
**When** it renders
**Then** the PromptsSection component is no longer displayed inline on this page

**Given** the AI Prompt Mode page is open
**When** the user looks at the bottom of the page (after the Context section)
**Then** a "Manage AI Prompts →" link is visible, styled with `text-primary text-sm` and hover underline

**Given** the user clicks "Manage AI Prompts →"
**When** navigation completes
**Then** the AI Prompts page loads with the full prompt management interface

## Epic 3: Streamlined Mode Pages & Balanced Settings

Mode pages become focused, self-documenting configuration hubs. Settings tabs get balanced density with logically grouped controls. Audio Input lives in Settings where it applies to all modes.

### Story 3.1: Move Audio Input from Dictation to Settings > General

As a user,
I want microphone and language settings in Settings > General,
So that I can configure audio input in one place that clearly applies to all recording modes — not buried under Dictation only.

**Acceptance Criteria:**

**Given** the Settings > General tab is open
**When** it renders
**Then** a new "Audio Input" section appears (after Hotkey Summary, before Speech-to-Text)
**And** it contains MicrophoneSelect (bound to `audioInputDeviceId`) and LanguageSelect (bound to `language`)

**Given** the Dictation Mode page is open
**When** it renders
**Then** the MicrophoneSelect and LanguageSelect components are no longer present
**And** the "Audio Input" section card is removed entirely from this page

**Given** the user changes the microphone in Settings > General > Audio Input
**When** they start a recording from any mode (Dictation or AI Prompt)
**Then** the selected microphone is used for recording

**Given** all changes are complete
**When** the following settings are checked
**Then** Code Mode toggle remains on Dictation page (FR18)
**And** STT Provider, API Key dialog, and Local Model management remain in Settings > General (FR19, FR26)
**And** Auto-paste and AI Cleanup toggles remain in Settings > General > Preferences (FR20)
**And** isManagedMode "VoxGen Cloud" message is preserved in STT Provider section (FR27)

### Story 3.2: Move "What's New" and Add Mode Page Microcopy

As a user,
I want "What's New" logically grouped with updates, and mode pages that explain themselves at a glance,
So that I can find features where I expect them and understand each page without needing documentation.

**Acceptance Criteria:**

**Given** the Settings > Notifications tab is open
**When** the Updates section renders
**Then** a "What's New →" link appears in the Updates section (after version/check for updates)
**And** clicking it opens the external changelog URL (`voxgenflow.vercel.app/whats-new.html`)

**Given** the Settings > Account tab is open
**When** it renders
**Then** the "What's New" sparkle button is no longer present in the License section header

**Given** the Dictation Mode page is open
**When** it renders
**Then** the page header shows microcopy: "Press a hotkey to record your voice. Speech is transcribed and typed into the active app."

**Given** the AI Prompt Mode page is open
**When** it renders
**Then** the page header shows microcopy: "Speak a prompt to generate AI content. Use keyword triggers to activate generation."

**Given** all changes are complete
**When** the following settings are checked
**Then** Generation settings (keyword triggers, prompt refinement, output length) remain on AI Prompt page (FR21)
**And** Context settings (clipboard, active window) remain on AI Prompt page (FR22)
**And** Sound effects, Error alerts, Auto-update, and Version check remain in Notifications (FR23)
**And** License management remains in Account (FR24)
**And** DevTools (admin-only) remains in Account (FR25)

## Epic 4: Codebase Cleanup

Remove dead code: unused pages, orphaned imports, and legacy components that add confusion and bloat.

### Story 4.1: Remove Dead Pages, Imports, and Legacy Components

As a developer,
I want unused code removed from the codebase,
So that the project is clean, maintainable, and doesn't confuse future development with orphaned files.

**Acceptance Criteria:**

**Given** the following page files exist but are never imported or routed to
**When** the cleanup is performed
**Then** `src/pages/SnippetsPage.tsx` is deleted
**And** `src/pages/WhatsNewPage.tsx` is deleted
**And** `src/pages/ThreeStepsPage.tsx` is deleted
**And** `src/pages/DictationPage.tsx` is deleted

**Given** the following settings components exist but are not imported by any active page
**When** the cleanup is performed
**Then** these files are deleted: `ProvidersSection.tsx`, `AboutSection.tsx`, `EnhancementSection.tsx`, `SettingsNav.tsx`, `AIProcessingSection.tsx`, `AccountSection.tsx`, `PowerModesSection.tsx`, `RecordingSection.tsx`, `ThemeToggle.tsx`, `EmailReminder.tsx`

**Given** all deletions are complete
**When** `npm run build` is executed
**Then** the build succeeds with no missing import errors
**And** no remaining file in `src/` imports any of the deleted files
