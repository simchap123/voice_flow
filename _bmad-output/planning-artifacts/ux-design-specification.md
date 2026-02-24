---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - _bmad-output/project-context.md
  - docs/PRD-v3.md
  - docs/index.md
  - docs/ARCHITECTURE.md
  - docs/USER_JOURNEY.md
  - docs/source-tree-analysis.md
---

# UX Design Specification — VoxGen

**Author:** SimchaPentelnik
**Date:** 2026-02-23

---

## Executive Summary

### Project Vision

VoxGen is a system-wide AI dictation and content generation desktop app. Users interact primarily through global hotkeys and an overlay — the main window exists for settings and history review. The UX goal of this pass is to eliminate setting duplication, fix misplaced controls, and organize the UI so every setting has exactly one logical home.

### Target Users

Professionals and power users (writers, developers, business people) who want hands-free text input. Moderately to very tech-savvy. Primary interaction is hotkey-driven; they open the main window infrequently to tweak settings or review history.

### Key Design Challenges

1. **Setting duplication** — Hotkeys are editable from both mode pages AND Settings > General, creating confusion about the canonical location
2. **Misplaced shared controls** — Mic, Language, and STT Provider affect all modes but live in Dictation or Settings without clear logic
3. **Scattered AI processing controls** — AI Cleanup toggle, Code Mode, AI Prompts, and STT Provider are split across 3 pages
4. **Uneven information density** — Settings > General is overloaded, Account tab is mostly empty, Notifications tab is sparse with unrelated "Updates" section

### Design Opportunities

1. **Single source of truth** — Each setting lives in exactly one place, eliminating duplicate edit paths
2. **Mode pages become mode-specific** — Only hotkey, trigger method, and mode-specific behavior on each mode page
3. **Logical Settings restructure** — Rebalance tabs so content density is even and related settings are grouped
4. **Surface hidden features** — Make "What's New" discoverable; consider sidebar placement

### Current UI Issues Inventory

| # | Issue | Type | Location |
|---|-------|------|----------|
| 1 | Hotkeys editable in 2 places (mode pages + Settings > General) | Duplicate | Dictation, AI Prompt, Settings > General |
| 2 | Audio Input (Mic + Language) only under Dictation | Misplaced | Dictation page |
| 3 | AI processing controls scattered (Cleanup toggle, Code Mode, Prompts, STT) | Split | Settings > General, Dictation, AI Prompt |
| 4 | "What's New" buried in Account > License header | Misplaced | Settings > Account |
| 5 | "Updates" section in Notifications tab | Misplaced | Settings > Notifications |
| 6 | Account tab nearly empty (70% blank) | Wasted space | Settings > Account |
| 7 | Settings > General > Recording section is redundant partial copy | Duplicate | Settings > General |
| 8 | DictationPage.tsx imported but never routed to | Dead code | App.tsx |

### Current Complete UI Inventory

**Sidebar:** History | MODES: Dictation, AI Prompt | Settings (footer) | User profile chip

**History Page:** Header (count), Recordings/Export/Clear buttons, Search bar, History cards (expand, copy, download recording, delete) with timestamp/duration/word count

**Dictation Mode Page:** Hold-to-Record hotkey, Toggle Recording hotkey + trigger method, Audio Input (mic + language), Code Mode toggle

**AI Prompt Mode Page:** Hotkey + trigger method, Generation (keyword triggers, prompt refinement, output length), Context (clipboard + active window toggles), AI Prompts (CRUD list + "Add Custom Prompt")

**Settings > General:** Recording (hold + AI prompt hotkeys), STT Provider (engine selector, API key, model size/status), Preferences (auto-paste, AI cleanup toggles)

**Settings > Notifications:** Sound & Alerts (sound effects, error alerts), Updates (auto-update, version + check)

**Settings > Account:** License (What's New link, license card, manage subscription, sign out), DevTools (admin only)

## Core User Experience

### Defining Experience

VoxGen's core interaction happens **outside the main window** — a global hotkey triggers recording, audio is transcribed, and text appears in the focused application. The main window is a secondary interface for configuration and history. The core UX principle for this reorganization: **every setting has exactly one logical home, and each page tells you how to use its features at a glance.**

Mode pages (Dictation, AI Prompt) are **full configuration hubs** — compact, self-contained pages where users configure everything about that mode: hotkey, trigger method, and mode-specific behavior. They should read almost like a "quick-start card" — a summary of how the mode works, with editable controls inline.

### Platform Strategy

- **Desktop only** (Electron, Windows-first) — mouse/keyboard interaction in the main window
- **Hotkey-driven primary workflow** — users rarely open the main window
- **Two-window architecture** stays as-is: main window (settings/history) + overlay (recording state)
- **Offline-capable** for local whisper; online for managed/BYOK STT providers

### Effortless Interactions

| Interaction | Design Goal |
|-------------|-------------|
| Finding where to change a setting | Every setting lives in **exactly one place** — no duplicates |
| Understanding a mode page | Each mode page shows a compact summary of "how this works" + all editable controls |
| Checking hotkey assignments | Settings > General shows a **read-only compact summary** of all hotkeys (editable only on mode pages) |
| Managing AI Prompts | Prompts get their own dedicated section/page since they can affect both Dictation and AI Prompt modes |
| Discovering "What's New" | Available as a link in Settings (moved from buried Account > License header) |
| Switching between modes | Sidebar stays the same — History, Dictation, AI Prompt, Settings |

### Critical Success Moments

1. **"Where do I change this?"** — User should never wonder. Each setting has one canonical location, and related settings are grouped logically.
2. **First visit to a mode page** — User immediately understands what the mode does, how to trigger it, and what they can customize.
3. **Settings don't feel overwhelming** — Tabs have roughly even content density. No tab is 70% empty, no tab is overloaded.
4. **AI Prompts are clear** — The prompt system is its own section, making it obvious that prompts can be used across modes.

### Experience Principles

1. **Single source of truth** — Every setting is editable in exactly one location. Summaries/read-only views are acceptable elsewhere, but editing happens in one place only.
2. **Compact and scannable** — Pages should not "take up a whole page" with sparse content. Dense, well-organized layouts that communicate quickly.
3. **Mode pages are self-documenting** — Each mode page acts as a mini quick-start guide: what the mode does, how to trigger it, what you can configure.
4. **Logical grouping over convention** — Settings are grouped by what they do (audio input, AI processing, preferences), not by historical accident.
5. **Progressive disclosure** — Core controls visible immediately; advanced options available but not overwhelming.

## Desired Emotional Response

### Primary Emotional Goals

| Emotion | Description |
|---------|-------------|
| **Confidence** | "I know exactly where to find and change any setting." No second-guessing, no hunting. |
| **Clarity** | "I understand what each page does and how to use it." Mode pages are self-documenting. |
| **Efficiency** | "I got in, changed what I needed, and got out." The main window is a quick pit stop, not a maze. |

### Emotional Journey Mapping

| Stage | Current Feeling | Target Feeling |
|-------|----------------|----------------|
| Opening a mode page | Confused — "Wait, can I also change this in Settings?" | Clear — "This is THE place for this mode's settings" |
| Visiting Settings > General | Overwhelmed — overloaded with hotkeys, STT, preferences | Focused — organized sections with even density |
| Looking for AI Prompts | Lost — "Is it under AI Prompt page? Settings?" | Obvious — dedicated section, clearly scoped |
| Checking hotkey assignments | Uncertain — two edit locations, which is canonical? | Confident — read-only summary in Settings, edit on mode page |
| Finding "What's New" | Surprised — buried sparkle icon in Account header | Natural — logical placement in Settings |

### Micro-Emotions

- **Confidence over Confusion** — The #1 priority. Every setting has one home. No duplicates, no ambiguity.
- **Trust over Skepticism** — "Changing this here actually changes it everywhere." Read-only summaries reinforce single-source-of-truth.
- **Satisfaction over Frustration** — Tabs have balanced content. No page feels empty or overloaded.
- **Accomplishment over Anxiety** — Mode pages explain how features work, reducing "am I doing this right?" moments.

### Design Implications

| Emotional Goal | UX Design Approach |
|---------------|-------------------|
| Confidence | Remove all duplicate edit paths; hotkeys editable only on mode pages |
| Clarity | Add brief "how this works" descriptions at the top of each mode page |
| Efficiency | Keep mode pages compact — no unnecessary whitespace or oversized sections |
| Trust | Read-only hotkey summary in Settings links to mode pages for editing |
| Satisfaction | Rebalance Settings tabs so no tab is 70% empty or overloaded |

### Emotional Design Principles

1. **No dead ends, no confusion** — If a user lands on any page, they should immediately know what it's for and what they can do.
2. **Respect the power user** — These users are tech-savvy. Don't over-explain; be compact and scannable.
3. **Visual consistency = trust** — Consistent section layouts across pages (header + description + controls) build confidence.
4. **Reduce cognitive load** — Fewer locations for the same setting = less to remember.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**1. Wispr Flow (Direct Competitor)**
- Minimal UI — almost no settings surface. Hold-to-talk is the entire product.
- Settings are a single flat panel: mic, language, hotkey, and done. No tabs, no nesting.
- **Lesson:** For a hotkey-driven tool, simpler settings = better. Users shouldn't spend time in the settings window.

**2. VS Code Settings**
- Master class in organizing 500+ settings without overwhelming the user.
- Left sidebar categories, flat list of settings per category, search bar at top.
- Each setting has a compact label + description + control on one line.
- **Lesson:** Compact, scannable rows (label + inline control) keep density high without feeling cluttered. Inline descriptions under controls make settings self-documenting.

**3. Discord (Desktop App)**
- Settings split into clear categories (My Account, User Settings, App Settings, etc.).
- Each category page has consistent layout: section header + description + controls.
- No setting appears in two places.
- **Lesson:** Consistent section patterns (header + brief description + controls) create predictability. Users learn the layout once and navigate by muscle memory.

**4. Notion Settings**
- Left sidebar with categories, each setting lives in exactly one category.
- Search takes you to the setting's one canonical home — no duplicates.
- **Lesson:** One home per setting, findable by scanning categories. The mental model is "if I can find the category, I can find the setting."

**5. VoxGen's Own Overlay**
- The overlay is already compact and purposeful: mic icon, stop, cancel — every element earns its pixel.
- **Lesson:** The main window's settings should follow the same philosophy. If the overlay can communicate recording state in 48px, mode pages can communicate "how to use this" in a single descriptive sentence per section.

### Transferable UX Patterns

| Pattern | Source | Application to VoxGen |
|---------|--------|----------------------|
| **Compact setting rows** | VS Code | Each setting = one row (label + control), not a full card or section |
| **Inline microcopy** | VS Code, Discord | One-line description under each section header makes mode pages self-documenting |
| **Category tabs with even density** | Discord, Notion | Rebalance General/Notifications/Account so each tab has meaningful content |
| **Read-only summary with "Edit" link** | macOS System Preferences | Hotkey summary in Settings as `<kbd>` badges + "Edit →" link to mode page |
| **Link, don't duplicate** | Notion | Read-only summaries link to canonical edit location with scroll-to-section anchoring |
| **Section header + description** | Discord, VS Code | Each mode page starts with a brief "what this does and how to use it" |
| **Single canonical location** | All well-designed apps | Every setting editable in exactly one place; cross-references are read-only |
| **Inline controls** | Wispr Flow | Toggles, dropdowns, and hotkey displays directly in the row — no modals needed |
| **Purposeful density** | VoxGen Overlay | Every element earns its pixel — no whitespace padding for its own sake |

### Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | VoxGen's Current State |
|-------------|-------------|----------------------|
| **Duplicate edit points** | Users don't know which is canonical, changes may not sync | Hotkeys editable in mode pages AND Settings > General |
| **Summary that looks editable** | Users click read-only controls expecting to edit, creating frustration | N/A (new risk if we add read-only summaries — must use `<kbd>` badge style, NOT disabled inputs) |
| **Kitchen-sink tab** | One tab crammed with unrelated settings | Settings > General has hotkeys + STT + preferences |
| **Ghost tabs** | Nearly empty tabs waste space and feel unfinished | Account tab is 70% blank |
| **Misplaced shared controls** | Settings that affect everything shouldn't be buried in one mode | Mic/Language under Dictation only |
| **Hidden features** | Burying discoverable features in unrelated headers | "What's New" as a tiny sparkle icon in Account |
| **Unrelated grouping** | Grouping by convenience rather than user mental model | "Updates" section inside Notifications tab |

### Design Inspiration Strategy

**Adopt:**
- Compact, scannable setting rows (label + inline control) from VS Code
- Consistent section layout (header + one-line description + controls) from Discord
- Single canonical location for every setting (Notion's one-home-per-setting model)
- Inline microcopy for self-documenting mode pages

**Adapt:**
- VS Code's flat settings list → VoxGen's tab structure (smaller scale, tabs work fine)
- Discord's sidebar categories → VoxGen's existing sidebar + Settings sub-tabs
- Read-only summary pattern → `<kbd>` badge hotkey display + "Edit →" link with scroll-to-section anchoring

**Avoid:**
- Wispr Flow's extreme minimalism (VoxGen has more settings surface to organize)
- Deep nesting or modal-based editing (keep everything inline and flat)
- Duplicate edit paths (the core problem being solved)
- Read-only summaries that look like editable controls (use visually distinct `<kbd>` badges, never disabled inputs)

## Design System Foundation

### Design System Choice

**Existing system — no change needed:** Tailwind CSS 3.4 + shadcn/ui (Radix primitives)

This is a **Themeable System** approach. shadcn/ui provides accessible, customizable components built on Radix primitives, styled with Tailwind utility classes. The existing system already delivers:

- Consistent component patterns (Button, Input, Select, Toggle, Dialog, etc.)
- Dark/light theme via HSL CSS variable tokens
- Custom sage/cream/charcoal palette
- `cn()` utility (clsx + tailwind-merge) for conditional styling

### Rationale for Selection

| Factor | Assessment |
|--------|-----------|
| **Already in production** | Entire app built on this stack — zero migration cost |
| **Fits reorganization scope** | We're moving settings around, not changing visual design |
| **Component coverage** | shadcn/ui already provides every component type needed (cards, tabs, toggles, selects, badges, buttons) |
| **Customization** | Tailwind utilities + CSS variables make layout changes trivial |
| **Accessibility** | Radix primitives handle keyboard nav, focus management, ARIA attributes |

### Implementation Approach

Since the design system stays the same, the implementation focus is on **layout patterns within the existing system**:

1. **Section component pattern** — Reusable section layout: header + one-line description + controls. Applied consistently across all mode pages and Settings tabs.
2. **Compact setting row** — Label + inline control on one line using existing Tailwind flex/grid utilities.
3. **`<kbd>` badge for read-only hotkeys** — New small component using existing `Badge` or plain `<kbd>` styled with Tailwind. Visually distinct from `HotkeyRecorder`.
4. **"Edit →" navigation links** — Text links styled with existing shadcn/ui Button variant (`variant="link"`) pointing to mode pages.

### Customization Strategy

**No visual redesign.** The only new UI elements needed:

| Element | Implementation | Existing Component |
|---------|---------------|-------------------|
| Read-only hotkey badge | `<kbd>` with Tailwind classes (`px-2 py-0.5 rounded bg-muted text-xs font-mono`) | None — new, trivial |
| "Edit →" link | shadcn Button `variant="link"` with `onClick` navigation | Existing Button component |
| Section description text | `<p className="text-sm text-muted-foreground">` | Existing Tailwind classes |
| Scroll-to-section anchoring | `id` attributes on sections + `scrollIntoView()` | Native browser API |

## Defining the Settings Experience

### Defining Experience

**"Open the window, find what I need, change it, close the window."**

Like Spotify's "search → play," VoxGen's main window experience should be: **land → scan → configure → done.** The user opens the main window rarely — to tweak a hotkey, switch their STT provider, or review history. The defining experience is the speed and confidence of that configuration loop.

If we nail "I always know where to find a setting and it takes one click to get there," the entire reorganization succeeds.

### User Mental Model

**How users currently think about the main window:**

| Mental Model | Current Reality | Target Reality |
|-------------|----------------|----------------|
| "Mode pages are about modes" | Partially — Dictation has shared Audio Input controls mixed in | Fully — each mode page is a complete hub for that mode only |
| "Settings is for app-wide config" | Partially — General has duplicate hotkeys AND shared STT config | Fully — Settings is for cross-cutting concerns (audio, AI, preferences, account) |
| "I can edit this wherever I see it" | Yes — hotkeys editable in 2 places | No — edit in one canonical place, see read-only summaries elsewhere |
| "Related things are near each other" | No — AI Cleanup in General, Code Mode in Dictation, Prompts in AI Prompt | Yes — AI processing grouped together, mode-specific controls on mode pages |

**Key mental model shift:** Users should think of mode pages as "how do I use this mode?" and Settings as "how does the app work overall?"

### Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| **Zero confusion** | User never asks "where do I change this?" — every setting has one obvious home |
| **Scan-and-find** | Any setting findable within 2 clicks (sidebar → page, or sidebar → Settings tab) |
| **Self-documenting pages** | New user understands what each mode does from the page header + inline microcopy alone |
| **Balanced density** | No Settings tab is more than ~30% emptier than the others |
| **No duplicate edits** | Every setting has exactly one editable control in the entire app |

### Novel UX Patterns

**Established patterns only** — this reorganization uses proven patterns, no novel interactions needed:

| Pattern | Type | Source |
|---------|------|--------|
| Tab-based settings | Established | Discord, VS Code, every desktop app |
| Sidebar + content area | Established | Current VoxGen layout (no change) |
| Section header + description + controls | Established | Discord, Notion |
| Read-only summary with edit link | Established | macOS System Preferences |
| `<kbd>` badge for keyboard shortcuts | Established | GitHub, VS Code, documentation sites |

**No user education needed.** Every pattern used is familiar to the target audience (tech-savvy professionals).

### Experience Mechanics

**1. Initiation — User opens main window**
- Lands on last-visited page (History by default)
- Sidebar shows 4 clear destinations: History, Dictation, AI Prompt, Settings

**2. Navigation — User finds the right page**
- Mode-specific settings? → Click mode name in sidebar
- App-wide settings? → Click Settings in footer
- Each page has a clear header + description confirming they're in the right place

**3. Configuration — User changes what they need**
- Controls are inline (no modals, no nested pages)
- Each control is in exactly one location
- Read-only summaries in Settings link to canonical edit location on mode pages
- Inline microcopy explains what each control does

**4. Confirmation — User knows the change took effect**
- Settings save immediately on change (existing behavior, no change needed)
- Visual feedback: toggle animations, select dropdown closes, hotkey recorder shows new key
- No "Save" button needed — everything is auto-persisted

**5. Exit — User closes the window and returns to work**
- Close window → overlay remains visible for recording
- All settings already persisted, no risk of losing changes

## Visual Design Foundation

### Color System

**Existing palette — no changes needed.** The app uses HSL CSS variables with a sage/cream/charcoal theme:

| Token | HSL Value | Role |
|-------|-----------|------|
| `--primary` | `152 32% 42%` (sage green) | Primary actions, ring focus, accent |
| `--background` | `40 33% 96%` (warm cream) | Page background |
| `--foreground` | `220 20% 16%` (charcoal) | Primary text |
| `--muted` | `40 15% 92%` | Muted backgrounds (badges, disabled states) |
| `--muted-foreground` | `220 10% 46%` | Secondary text, placeholders |
| `--card` | `40 30% 98%` | Card surfaces |
| `--border` | `40 18% 88%` | Borders, dividers |
| `--destructive` | `0 72% 51%` | Error states, delete actions |
| `--accent` | `152 25% 85%` | Accent backgrounds (light sage) |

**New element colors for this reorganization:**
- Read-only `<kbd>` badges: `bg-muted text-muted-foreground` — visually distinct from interactive controls
- "Edit →" links: `text-primary` — uses existing sage accent color
- Section description text: `text-muted-foreground` — secondary text weight

### Typography System

**Existing — no changes needed.**

- **Primary font:** DM Sans (Google Fonts) — clean, modern, geometric sans-serif
- **Fallback chain:** Inter → system fonts (Segoe UI, Roboto, etc.)
- **Rendering:** `-webkit-font-smoothing: antialiased`

**Type scale used in the app (Tailwind defaults):**

| Element | Class | Usage |
|---------|-------|-------|
| Page headers | `text-lg font-semibold` | "Dictation Mode", "Settings" |
| Section headers | `text-sm font-medium` | "Audio Input", "Preferences" |
| Body/labels | `text-sm` | Setting labels, descriptions |
| Microcopy (new) | `text-sm text-muted-foreground` | Inline section descriptions |
| `<kbd>` badges (new) | `text-xs font-mono` | Read-only hotkey display |

### Spacing & Layout Foundation

**Existing — minor refinements for consistency.**

- **Base unit:** Tailwind's 4px scale (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px, etc.)
- **Border radius:** `--radius: 0.75rem` (12px) — consistent rounded corners
- **Layout pattern:** Sidebar (fixed) + scrollable content area

**Section spacing pattern for reorganized pages:**

| Element | Spacing | Class |
|---------|---------|-------|
| Between sections | 24px | `space-y-6` |
| Section header to description | 4px | `space-y-1` |
| Description to controls | 12px | `mt-3` |
| Between setting rows | 12px | `space-y-3` |
| Control internal padding | 8-12px | Existing shadcn/ui component defaults |

### Accessibility Considerations

- **Contrast:** HSL variables provide sufficient contrast — charcoal on cream exceeds WCAG AA
- **Focus rings:** `--ring` uses primary sage color for visible keyboard focus
- **Animations:** `tailwindcss-animate` provides `prefers-reduced-motion` support
- **Read-only vs editable:** `<kbd>` badge visual must be clearly distinct from `HotkeyRecorder` input — different background, no border/outline treatment, no hover/focus states

## Design Direction Decision

### Design Directions Explored

**Direction A: "Mode hubs + lean Settings"** — Mode pages are full configuration hubs; Settings only has cross-cutting concerns; AI Prompts stays on AI Prompt page.

**Direction B: "Mode hubs + AI Prompts as its own page"** — Same as A, but AI Prompts promoted to its own sidebar item since prompts affect both modes.

**Chosen: Direction B** — AI Prompts as its own page, aligning with user input that "AI prompts could be its own section page, since prompts can affect dictation mode."

### Chosen Direction — Page-by-Page Layout

**Sidebar (updated):**
- History
- MODES: Dictation, AI Prompt
- AI Prompts (new sidebar item)
- Settings (footer)
- User profile chip

**Dictation Mode Page:** Header + microcopy → Recording section (Hold-to-Record hotkey, Toggle Recording hotkey, trigger method) → Options (Code Mode toggle). *Removed:* Audio Input (mic + language) moved to Settings > General.

**AI Prompt Mode Page:** Header + microcopy → Recording section (AI Prompt hotkey, trigger method) → Generation (keyword triggers, prompt refinement, output length) → Context (clipboard + active window toggles) → "Manage AI Prompts →" link. *Removed:* PromptsSection moved to dedicated AI Prompts page.

**AI Prompts Page (NEW):** Header + microcopy → Active Prompt display → Built-in Prompts list → Custom Prompts CRUD + "Add Custom Prompt."

**Settings > General:** Hotkey Summary (read-only `<kbd>` badges + "Edit →" links) → Audio Input (mic + language, moved from Dictation) → Speech-to-Text (STT provider, API key, model) → Preferences (auto-paste, AI cleanup).

**Settings > Notifications:** Sound & Alerts (sound effects, error alerts) → Updates (auto-update, version/check, "What's New →" link moved from Account).

**Settings > Account:** License (license card, manage subscription, sign out) → About (version, credits) → DevTools (admin only).

### Setting Migration Map

| Setting | Current Location | New Location | Change |
|---------|-----------------|-------------|--------|
| Hold-to-Record hotkey | Dictation + Settings > General | Dictation (edit) + Settings (read-only) | Remove duplicate edit |
| Toggle Recording hotkey | Dictation only | Dictation (edit) + Settings (read-only) | Add read-only summary for discoverability |
| AI Prompt hotkey | AI Prompt + Settings > General | AI Prompt (edit) + Settings (read-only) | Remove duplicate edit |
| Microphone | Dictation | Settings > General | Move |
| Language | Dictation | Settings > General | Move |
| Code Mode | Dictation | Dictation | No change |
| STT Provider | Settings > General | Settings > General | No change |
| Auto-paste | Settings > General | Settings > General | No change |
| AI Cleanup | Settings > General | Settings > General | No change |
| Keyword Triggers | AI Prompt | AI Prompt | No change |
| Prompt Refinement | AI Prompt | AI Prompt | No change |
| Output Length | AI Prompt | AI Prompt | No change |
| Clipboard/Window Context | AI Prompt | AI Prompt | No change |
| AI Prompts CRUD | AI Prompt | AI Prompts (new page) | Move |
| Sound Effects | Notifications | Notifications | No change |
| Error Alerts | Notifications | Notifications | No change |
| Auto-update | Notifications | Notifications | No change |
| What's New link | Account header | Notifications > Updates | Move |
| License | Account | Account | No change |
| DictationPage.tsx | Imported, never routed | Delete dead code | Remove |
| SnippetsPage.tsx | Not imported, unreachable | Delete dead code | Remove |
| WhatsNewPage.tsx | Not imported, unreachable | Delete dead code | Remove |
| ThreeStepsPage.tsx | Not imported, unreachable | Delete dead code | Remove |
| Legacy settings components* | Not imported by current SettingsPage | Delete dead code | Remove |

*Legacy: ProvidersSection, AboutSection, EnhancementSection, SettingsNav, AIProcessingSection, AccountSection, PowerModesSection, RecordingSection, ThemeToggle, EmailReminder

### Implementation Approach

1. Create `AIPromptsPage.tsx` — Move PromptsSection content, add sidebar nav item
2. Update `DictationModePage.tsx` — Remove MicrophoneSelect + LanguageSelect, add microcopy
3. Update `AIPromptModePage.tsx` — Remove PromptsSection, add "Manage AI Prompts →" link
4. Update `SettingsPage.tsx` — Replace hotkey editors with `<kbd>` badges, add Audio Input, move What's New, add About
5. Update `Sidebar.tsx` — Add "AI Prompts" nav item
6. Update `App.tsx` — Add AI Prompts route, remove dead DictationPage import
7. Create `HotkeyBadge` component — Read-only `<kbd>` display with "Edit →" link

## User Journey Flows

### Journey 1: Change a Hotkey

The most common configuration task. Currently confusing (2 edit locations). After reorganization, no matter which path (mode page directly or Settings first), user ends up at the one canonical edit location. Settings summary acts as navigation aid, not a duplicate.

**Flow:** User wants to change hotkey → if knows mode, click mode in sidebar → Recording section → HotkeyRecorder → auto-saved. If unsure, click Settings → General → Hotkey Summary → see `<kbd>` badge + "Edit →" → click link → navigates to mode page.

### Journey 2: Switch Microphone or Language

Currently buried in Dictation page. After reorganization: Settings → General → Audio Input section → select from dropdown → auto-saved. One location, no ambiguity.

### Journey 3: Manage AI Prompts

Currently buried at bottom of AI Prompt Mode page. After reorganization: Click "AI Prompts" in sidebar (or "Manage AI Prompts →" link from AI Prompt Mode page) → dedicated AI Prompts page → select/create/edit/delete prompts.

### Journey 4: New User First Visit

Mode pages are self-documenting. User opens main window → clicks Dictation in sidebar → reads microcopy ("Press a hotkey to record...") → sees Recording section with hotkey + trigger method → understands the mode without external docs.

### Journey 5: Check What's New

Currently hidden sparkle icon in Account header. After reorganization: Settings → Notifications → Updates section → "What's New →" link → opens changelog. Logically grouped with version/update checks.

### Journey Patterns

| Pattern | Description | Used In |
|---------|-------------|---------|
| **Direct navigation** | Sidebar → page → section | All journeys |
| **Summary-to-edit redirect** | Read-only display → "Edit →" link → canonical edit page | Hotkey journey |
| **Cross-reference link** | "Manage AI Prompts →" links to dedicated page | AI Prompts journey |
| **Inline self-documentation** | Microcopy under page headers explains purpose | New user journey |
| **Auto-save feedback** | All settings auto-persist on change | All configuration journeys |

### Flow Optimization Principles

1. **Max 2 clicks to any setting** — Sidebar → page (or Sidebar → Settings → tab). Never deeper.
2. **No dead-end navigation** — Every read-only summary links to the canonical edit location.
3. **Self-documenting pages** — Inline microcopy eliminates "what does this page do?" confusion.
4. **Consistent section layout** — Every page follows header → microcopy → sections → controls.
5. **One path, not two** — Settings in one place don't need "which one is right?" decisions.

## Component Strategy

### Design System Components (Existing — shadcn/ui)

All components needed already exist in the design system. No modifications to existing shadcn/ui components required. Button (`variant="link"`), Tabs, Switch, Select, RadioGroup, Card, Badge, Label, Separator — all used as-is.

**Gap:** One custom component needed — `HotkeyBadge`.

### Custom Components

#### HotkeyBadge

**Purpose:** Read-only hotkey display with navigation link to canonical edit page.
**Usage:** Settings > General > Hotkey Summary — one per hotkey.
**Anatomy:** `[label]  [<kbd> badge]  [Edit → link]`
**Props:** `label: string`, `hotkey: string`, `editPage: string`, `editSection?: string`
**States:** Default only (informational). "Edit →" link has hover underline.
**Accessibility:** Link has `aria-label="Edit {label} hotkey in {page} settings"`. `<kbd>` is semantic HTML.
**Behavior:** Clicking "Edit →" navigates to mode page, optionally scrolls to section.
**Styling:** `<kbd>` uses `bg-muted text-muted-foreground text-xs font-mono rounded px-2 py-0.5`. Visually distinct from interactive HotkeyRecorder.

#### PageHeader (optional)

**Purpose:** Consistent page title + microcopy description. Could be inline JSX instead.
**Anatomy:** `<h1>` title + `<p>` description.
**Implementation:** ~5 lines, trivial extraction.

### Component Implementation Strategy

| Priority | Component | Action |
|----------|-----------|--------|
| Must have | `HotkeyBadge` | Create new (~20 lines) |
| Nice to have | `PageHeader` | Optional extraction |
| Reuse as-is | All shadcn/ui components | No modifications |
| Move, don't modify | `PromptsSection` | Move to new AIPromptsPage |
| Move, don't modify | `MicrophoneSelect`, `LanguageSelect` | Move from DictationModePage to SettingsPage |

### Implementation Roadmap

Single phase — all changes in one release:

1. Create `HotkeyBadge` component
2. Create `AIPromptsPage.tsx` — lift PromptsSection into new page
3. Update `Sidebar.tsx` — add AI Prompts nav item
4. Update `App.tsx` — add route, remove dead DictationPage import
5. Update `DictationModePage.tsx` — remove Audio Input, add microcopy
6. Update `AIPromptModePage.tsx` — remove PromptsSection, add link + microcopy
7. Update `SettingsPage.tsx` — replace HotkeyRecorders with HotkeyBadge, add Audio Input, reorganize tabs

## UX Consistency Patterns

### Section Layout Pattern

Every section follows: section title (text-sm font-medium, in card/bordered container) → optional one-line description (text-sm text-muted-foreground) → setting rows (flex justify-between items-center: label left, control right). Spacing: space-y-3 between rows, space-y-6 between sections.

### Navigation Patterns

| Pattern | When | Behavior |
|---------|------|----------|
| Sidebar → page | Primary navigation | Click sidebar item → load page |
| Settings tab | Within Settings | Click tab → switch content |
| "Edit →" link | Read-only summary to edit page | `setCurrentPage()` + optional `scrollIntoView()` |
| "Manage X →" link | Cross-page reference | Navigate to related page |

All navigation links: `text-primary text-sm` with hover underline.

### Feedback Patterns

No toasts for settings changes — all feedback is inline and immediate. Toggle slides, select closes, HotkeyRecorder shows new key. Errors shown as `text-destructive text-sm` inline below control. Toasts reserved for recording/transcription events only.

### Form Patterns

| Control | When | Component |
|---------|------|-----------|
| Toggle (Switch) | Boolean on/off | `Switch` |
| Select dropdown | 3+ options | `Select` |
| Radio group | 2-3 mutually exclusive | `RadioGroup` |
| HotkeyRecorder | Capture shortcut (editable) | Existing custom |
| HotkeyBadge | Display shortcut (read-only) | New component |
| Text input | API keys, search | `Input` |

Every setting row: label + control on one line. Never stack label above control.

### Page Header Pattern

Every page starts with: title (`text-lg font-semibold`) → one-line description (`text-sm text-muted-foreground mt-1`) → 24px gap (`mb-6`) → first section.

**Microcopy:**
- Dictation Mode: "Press a hotkey to record your voice. Speech is transcribed and typed into the active app."
- AI Prompt Mode: "Speak a prompt to generate AI content. Use keyword triggers to activate generation."
- AI Prompts: "Prompts shape how AI processes your speech. The active prompt applies to both dictation cleanup and content generation."
- History / Settings: no microcopy needed

### Empty States

Empty states use `text-muted-foreground text-sm text-center` with brief instruction text.

## Responsive Design & Accessibility

### Responsive Strategy

**Not applicable.** VoxGen is a desktop Electron app with a fixed-size frameless window. No tablet, mobile, or responsive breakpoints. No media queries needed.

### Accessibility Strategy

**Target: WCAG AA basics** — appropriate for a hotkey-driven desktop power-user tool.

| Requirement | Status | Notes |
|-------------|--------|-------|
| Color contrast | Covered | Charcoal on cream exceeds 4.5:1, AA-compliant |
| Keyboard navigation | Covered | Radix primitives handle focus, arrow-key nav, Enter/Space |
| Focus indicators | Covered | `--ring` CSS variable provides visible sage focus ring |
| Semantic HTML | Mostly covered | New `<kbd>` elements are semantic |
| Screen reader | Partial | New HotkeyBadge "Edit →" link needs `aria-label` |
| Reduced motion | Covered | `tailwindcss-animate` respects `prefers-reduced-motion` |

**New requirements for this reorganization:**
- HotkeyBadge "Edit →" link: `aria-label="Edit {hotkey name} in {page name} settings"`
- Use semantic `<kbd>` for hotkey badges (not `<span>`)
- Verify tab order after moving components between pages

### Testing Strategy

- Verify Tab key cycles through all controls on each reorganized page
- Verify "Edit →" links navigate correctly
- Verify screen reader announces `<kbd>` badges as keyboard shortcuts
- Test tab order after component moves to ensure logical flow
