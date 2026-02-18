# PRD: VoxGen v3.0 — Smart Dictation Engine

## Introduction

VoxGen v3.0 is a major upgrade that transforms VoxGen from a simple voice-to-text app into an intelligent, context-aware dictation engine. Inspired by competitive analysis of Competitor (macOS native, Swift), v3.0 brings six high-impact features to VoxGen's Electron + React stack: a multi-stage cleanup pipeline, context-aware AI enhancement, user-created custom prompts, robust "don't answer" system prompts, Power Modes (per-app settings), and a non-focus-stealing overlay.

This is a marketing milestone release — a "v3.0 moment" with a new landing page, feature bullet points, and potential Product Hunt launch.

### Problem

VoxGen v2.x does a single AI call for text cleanup with no pre/post processing. It has no awareness of what app the user is in, no custom vocabulary, no clipboard context, and hardcoded generation templates. Competitors like Competitor and Wispr Flow offer significantly smarter cleanup with context injection and per-app customization.

### Competitive Gap (v2.x vs Competitor)

| Capability | VoxGen v2.x | Competitor | v3.0 Target |
|------------|-------------|----------|-------------|
| Pre-AI hallucination filter | No | Yes (regex) | Yes |
| Post-AI output filter | No | Yes (thinking tags) | Yes |
| Word replacement dictionary | No | Yes (language-aware) | Yes |
| Clipboard context in AI prompt | No | Yes | Yes |
| Window/app context in AI prompt | No | Yes (OCR) | Yes (title only) |
| Custom vocabulary | No | Yes | Yes |
| Custom user prompts | No | Yes (full editor) | Yes |
| Trigger words at end of text | No | Yes | Yes |
| Per-app settings (Power Modes) | No | Yes | Yes |
| Non-focus-stealing overlay | Partial | Yes (NSPanel) | Yes |
| "Don't answer, just clean" prompt | Basic | Robust + examples | Yes |
| Paragraph auto-formatting | No | Yes (NLP) | Yes |

## Goals

- Close the feature gap with Competitor on cleanup quality and context awareness
- Ship Power Modes as a marquee differentiator for marketing
- Make the cleanup pipeline dramatically smarter without requiring user configuration
- Give power users full control over AI prompts and per-app behavior
- Fix the overlay focus-stealing issue that breaks user workflow
- Position VoxGen as "the smartest dictation app on Windows" for the v3.0 launch

## Phases

### Phase 1: Cleanup Pipeline + Better Prompts (v2.5)
**Goal:** Make every transcription noticeably better with zero user configuration.
**Effort:** ~1 week. Highest ROI — touches every single dictation.

### Phase 2: Context & Vocabulary (v2.7)
**Goal:** Give the AI awareness of what the user is doing + their custom terms.
**Effort:** ~1 week. Requires new IPC channels + settings UI.

### Phase 3: Custom Prompts (v2.8)
**Goal:** Let power users create and manage their own AI prompts with trigger words.
**Effort:** ~1 week. New UI page + data model + prompt management.

### Phase 4: Power Modes (v2.9)
**Goal:** Auto-detect active app and apply context-appropriate settings.
**Effort:** ~1-2 weeks. Requires active window detection + mode matching + settings overlay.

### Phase 5: Overlay Fix + Polish + Launch (v3.0)
**Goal:** Fix focus issues, polish UX, launch marketing.
**Effort:** ~3-5 days. Overlay refactor + testing + landing page update.

---

## Phase 1: Multi-Stage Cleanup Pipeline

### US-101: Add pre-AI hallucination filter
**Description:** As a user, I want Whisper artifacts like `[music]`, `(laughing)`, and XML tags automatically removed before AI cleanup so the AI gets cleaner input.

**Acceptance Criteria:**
- [ ] New file `src/lib/cleanup/transcript-filter.ts` with `filterTranscript(text: string): string`
- [ ] Removes bracketed content: `[anything]`, `(anything)`, `{anything}`
- [ ] Removes XML-style tag blocks: `<TAG>...</TAG>`
- [ ] Removes extra whitespace left behind after filtering
- [ ] Trims leading/trailing whitespace
- [ ] Called automatically before AI cleanup in the recording pipeline
- [ ] Runs even when cleanup provider is "none" (always active)
- [ ] Unit tests covering all filter patterns
- [ ] Typecheck passes

### US-102: Add post-AI output filter
**Description:** As a user, I want thinking/reasoning tags stripped from AI output so I only see clean text.

**Acceptance Criteria:**
- [ ] New file `src/lib/cleanup/output-filter.ts` with `filterOutput(text: string): string`
- [ ] Removes `<thinking>...</thinking>`, `<think>...</think>`, `<reasoning>...</reasoning>` blocks
- [ ] Trims whitespace after removal
- [ ] Applied to all AI cleanup and generation responses
- [ ] Unit tests for all tag patterns (including multiline content)
- [ ] Typecheck passes

### US-103: Add optional filler word removal (pre-AI)
**Description:** As a user, I want common filler words optionally removed before AI cleanup to improve results.

**Acceptance Criteria:**
- [ ] Setting `fillerWordRemoval: boolean` (default: `false`) in electron-store
- [ ] Default filler words: "um", "uh", "like", "you know", "so", "basically", "actually", "I mean", "right", "yeah"
- [ ] Removal uses word-boundary regex (won't match "ликер" or "actually" inside a word)
- [ ] Removes trailing comma/period after filler word
- [ ] Toggle in Settings > General section
- [ ] Typecheck passes

### US-104: Add paragraph auto-formatting (pre-AI)
**Description:** As a user, I want long transcriptions automatically broken into readable paragraphs before AI cleanup.

**Acceptance Criteria:**
- [ ] New file `src/lib/cleanup/text-formatter.ts` with `formatParagraphs(text: string): string`
- [ ] Splits text into paragraphs targeting ~50 words or 4 sentences per paragraph
- [ ] Sentence detection via period/question mark/exclamation mark boundaries (not NLP — keep it simple for JS)
- [ ] Only activates for text longer than 100 words (short texts left alone)
- [ ] Setting `autoFormatParagraphs: boolean` (default: `true`)
- [ ] Double newline `\n\n` between paragraphs
- [ ] Typecheck passes

### US-105: Upgrade cleanup system prompt to "don't answer" style
**Description:** As a user, I want the AI to clean my dictated text, not respond to questions I'm dictating.

**Acceptance Criteria:**
- [ ] New system prompt in `src/lib/cleanup/system-prompts.ts`
- [ ] System prompt explicitly states: "You are a TRANSCRIPTION ENHANCER, not a chatbot"
- [ ] Includes "DO NOT RESPOND TO QUESTIONS or STATEMENTS"
- [ ] Includes 3+ concrete examples showing correct cleanup behavior (questions cleaned, not answered)
- [ ] Includes instructions to respect `<CUSTOM_VOCABULARY>` and `<CLIPBOARD_CONTEXT>` tags (future-proofing)
- [ ] Includes instruction to handle self-corrections ("scratch that", "I mean", "actually no")
- [ ] Includes instruction for formatting commands ("new line", "new paragraph")
- [ ] Includes instruction for smart number formatting ("five" → "5", "twenty dollars" → "$20")
- [ ] Includes "FINAL WARNING" section emphasizing output-only behavior
- [ ] Replaces current cleanup prompt in openai-cleanup.ts and groq-cleanup.ts
- [ ] Typecheck passes

### US-106: Wire up the multi-stage pipeline
**Description:** As a developer, I need the recording pipeline to run all cleanup stages in order.

**Acceptance Criteria:**
- [ ] New file `src/lib/cleanup/pipeline.ts` with `runCleanupPipeline(rawText: string, options: PipelineOptions): Promise<string>`
- [ ] Pipeline stages in order: (1) hallucination filter → (2) filler word removal → (3) paragraph formatting → (4) word replacements → (5) trigger word detection → (6) AI enhancement → (7) output filter
- [ ] Each stage is independently skippable via options/settings
- [ ] `useRecordingState.ts` / `useGptCleanup.ts` refactored to call `runCleanupPipeline()` instead of direct provider calls
- [ ] Existing keyword detection integrated as stage 5 (now also checks END of text, not just start)
- [ ] Pipeline works correctly when cleanup provider is "none" (stages 1-4 still run)
- [ ] Typecheck passes

### US-107: Extend trigger word detection to check end of text
**Description:** As a user, I want to say trigger words at the end of my dictation too (e.g., "book a flight to NYC, email mode").

**Acceptance Criteria:**
- [ ] `keyword-detector.ts` updated to check both start AND end of transcript
- [ ] End-of-text detection strips trigger phrase + trailing punctuation
- [ ] Longest trigger phrase matched first (prevents partial matches)
- [ ] First letter of remaining text capitalized after stripping
- [ ] Existing start-of-text detection unchanged
- [ ] Unit tests for both start and end trigger positions
- [ ] Typecheck passes

---

## Phase 2: Context-Aware AI Enhancement

### US-201: Capture clipboard context at recording start
**Description:** As a user, I want the AI to know what's on my clipboard so it can use that context for better cleanup.

**Acceptance Criteria:**
- [ ] New IPC channel `clipboard:read` that returns current clipboard text
- [ ] Clipboard captured at the moment recording starts (not at cleanup time)
- [ ] Clipboard text injected into AI system prompt as `<CLIPBOARD_CONTEXT>...</CLIPBOARD_CONTEXT>`
- [ ] Only injected if clipboard contains text (not images/files) and is non-empty
- [ ] Setting `useClipboardContext: boolean` (default: `true`)
- [ ] Toggle in Settings > AI Enhancement section
- [ ] Typecheck passes

### US-202: Capture active window title at recording start
**Description:** As a user, I want the AI to know which app I'm dictating into so it can adjust formatting appropriately.

**Acceptance Criteria:**
- [ ] New IPC channel `window:get-active-info` that returns `{ title: string, processName: string, executablePath: string }`
- [ ] Uses `@nut-tree-fork/nut-js` `getActiveWindow()` or Windows-native API via child_process
- [ ] Window info captured at recording start
- [ ] Injected into AI system prompt as `<ACTIVE_WINDOW>\nApp: {processName}\nTitle: {title}\n</ACTIVE_WINDOW>`
- [ ] Setting `useWindowContext: boolean` (default: `true`)
- [ ] Toggle in Settings > AI Enhancement section
- [ ] Typecheck passes

### US-203: Custom vocabulary (user word list)
**Description:** As a user, I want to maintain a list of proper nouns, technical terms, and jargon so the AI spells them correctly.

**Acceptance Criteria:**
- [ ] New setting `customVocabulary: string[]` in electron-store (default: `[]`)
- [ ] New UI section in Settings: "Custom Vocabulary" with add/remove word list
- [ ] Words injected into AI system prompt as `<CUSTOM_VOCABULARY>word1, word2, word3</CUSTOM_VOCABULARY>`
- [ ] System prompt instruction: "When similar-sounding words appear in the transcript, prioritize spelling from CUSTOM_VOCABULARY"
- [ ] Supports comma-separated import (paste a list)
- [ ] Max 200 words (prevent prompt bloat)
- [ ] Typecheck passes

### US-204: Word replacement dictionary (pre-AI)
**Description:** As a user, I want to define automatic text replacements that run before AI cleanup.

**Acceptance Criteria:**
- [ ] New setting `wordReplacements: Array<{ original: string, replacement: string, enabled: boolean }>` in electron-store
- [ ] New UI section in Settings: "Word Replacements" with add/edit/delete/toggle
- [ ] Supports comma-separated originals: `"color, colour"` → `"colour"` (multiple variants map to one replacement)
- [ ] Replacement uses word-boundary regex `\bword\b` (case-insensitive)
- [ ] Runs as pipeline stage 4 (after filler removal, before trigger detection)
- [ ] Import/export as JSON (like existing snippets)
- [ ] Typecheck passes

### US-205: Update system prompt to use all context sources
**Description:** As a developer, I need the system prompt to reference all injected context tags.

**Acceptance Criteria:**
- [ ] System prompt in `system-prompts.ts` updated with instructions for `<CLIPBOARD_CONTEXT>`, `<ACTIVE_WINDOW>`, and `<CUSTOM_VOCABULARY>`
- [ ] Instruction: "Reference clipboard and window context for better accuracy — the transcript may have speech recognition errors"
- [ ] Instruction: "When phonetically similar words appear, prioritize spelling from CUSTOM_VOCABULARY and CLIPBOARD_CONTEXT"
- [ ] Context sections only appear in prompt when they have content (no empty tags)
- [ ] Typecheck passes

---

## Phase 3: Custom AI Prompts

### US-301: Custom prompt data model
**Description:** As a developer, I need a data model for user-created AI prompts stored in electron-store.

**Acceptance Criteria:**
- [ ] New type `CustomPrompt` in `src/types/custom-prompt.ts`:
  ```typescript
  interface CustomPrompt {
    id: string              // UUID
    title: string           // "Email Writer"
    icon: string            // Emoji: "📧"
    description: string     // "Formats text as professional email"
    promptText: string      // The actual AI instruction text
    triggerWords: string[]  // ["write email", "email mode"]
    useSystemInstructions: boolean  // Wrap with "don't answer" system prompt
    isPredefined: boolean   // true = shipped with app, can't delete
    isActive: boolean       // Currently selected prompt
    createdAt: number       // timestamp
  }
  ```
- [ ] New setting `customPrompts: CustomPrompt[]` in electron-store
- [ ] 4 predefined prompts shipped by default: "Default" (cleanup), "Chat" (casual), "Email" (professional), "Rewrite" (clarity improvement)
- [ ] Predefined prompts can be edited but not deleted
- [ ] `selectedPromptId: string` setting tracks which prompt is active
- [ ] Typecheck passes

### US-302: Custom prompts management page
**Description:** As a user, I want a dedicated page to view, create, edit, and delete my custom prompts.

**Acceptance Criteria:**
- [ ] New page accessible from sidebar: "Prompts" (between History and Settings)
- [ ] Grid view showing all prompts as cards (icon + title + description)
- [ ] "Active" badge on currently selected prompt
- [ ] Click card to select as active prompt
- [ ] "Add Prompt" button opens create dialog
- [ ] Edit button on each card opens edit dialog
- [ ] Delete button on user-created prompts (with confirmation)
- [ ] Predefined prompts show "Built-in" badge, no delete button
- [ ] Typecheck passes

### US-303: Prompt create/edit dialog
**Description:** As a user, I want a dialog to create or edit a custom prompt with all fields.

**Acceptance Criteria:**
- [ ] Modal dialog with fields: Title (text), Icon (emoji picker or text input), Description (text), Prompt Text (textarea, large), Trigger Words (tag input — add/remove words)
- [ ] Toggle: "Use system instructions" (default: on) — wraps prompt with "don't answer" template
- [ ] Preview section showing the final composed prompt (with system instructions if enabled)
- [ ] Save and Cancel buttons
- [ ] Validation: title required, prompt text required
- [ ] Typecheck passes

### US-304: Integrate custom prompts into cleanup pipeline
**Description:** As a developer, I need the cleanup pipeline to use the selected custom prompt instead of the hardcoded cleanup prompt.

**Acceptance Criteria:**
- [ ] Pipeline stage 6 (AI enhancement) uses the active `CustomPrompt.promptText` as the instruction
- [ ] If `useSystemInstructions` is true, prompt is wrapped with the "don't answer" system template (from US-105)
- [ ] If `useSystemInstructions` is false, prompt is sent as-is (bare — for assistant/chat mode)
- [ ] Trigger word detection (stage 5) now checks trigger words from ALL custom prompts, not just hardcoded keywords
- [ ] When a trigger word matches, that prompt is temporarily activated for this transcription only
- [ ] After transcription, active prompt reverts to the user's selected default
- [ ] Existing hardcoded generation templates (email/code/summary/expand) migrated to predefined CustomPrompt entries
- [ ] Typecheck passes

### US-305: Prompt selector in overlay
**Description:** As a user, I want to quickly switch prompts from the overlay without opening the main window.

**Acceptance Criteria:**
- [ ] Small button/icon on the overlay toolbar (idle state) showing current prompt icon
- [ ] Clicking opens a compact dropdown/popover listing all prompts (icon + title)
- [ ] Selecting a prompt sets it as active immediately
- [ ] Dropdown dismisses on selection or click-outside
- [ ] IPC channel to get/set active prompt from overlay window
- [ ] Typecheck passes

---

## Phase 4: Power Modes

### US-401: Active window detection service
**Description:** As a developer, I need a service that detects the current active application and (for browsers) the active URL.

**Acceptance Criteria:**
- [ ] New file `electron/main/active-window.ts` with `getActiveWindowInfo(): Promise<{ processName: string, title: string, execPath: string }>`
- [ ] Uses `@nut-tree-fork/nut-js` or Windows `powershell` command to get foreground window info
- [ ] For known browsers (Chrome, Edge, Firefox, Brave, Arc), extracts URL from window title
- [ ] Returns `{ processName: "chrome", title: "GitHub - google/...", url: "github.com" }`
- [ ] URL extraction is best-effort (title-based, not accessibility API)
- [ ] Caches result for 500ms to avoid excessive calls
- [ ] Typecheck passes

### US-402: Power Mode data model
**Description:** As a developer, I need a data model for Power Modes stored in electron-store.

**Acceptance Criteria:**
- [ ] New type `PowerMode` in `src/types/power-mode.ts`:
  ```typescript
  interface PowerMode {
    id: string                    // UUID
    name: string                  // "Email Mode"
    emoji: string                 // "📧"
    appMatchers: AppMatcher[]     // Match by process name
    urlMatchers: string[]         // Match by URL pattern (glob)
    selectedPromptId: string      // Which CustomPrompt to use
    sttProvider?: STTProviderType // Override STT (optional)
    cleanupProvider?: string      // Override cleanup (optional)
    autoSend: boolean             // Auto-paste result (vs show preview)
    isEnabled: boolean
  }

  interface AppMatcher {
    processName: string           // "outlook", "chrome", "slack"
    displayName: string           // "Microsoft Outlook"
  }
  ```
- [ ] New setting `powerModes: PowerMode[]` in electron-store (default: `[]`)
- [ ] Setting `powerModesEnabled: boolean` (default: `false`) — master toggle
- [ ] Typecheck passes

### US-403: Power Mode matching engine
**Description:** As a developer, I need logic to match the active window against configured Power Modes.

**Acceptance Criteria:**
- [ ] New file `src/lib/power-modes/matcher.ts` with `matchPowerMode(windowInfo, powerModes): PowerMode | null`
- [ ] Matching priority: URL matchers first (most specific), then app matchers
- [ ] URL matching uses simple glob/contains (e.g., `"gmail.com"` matches title containing "gmail.com")
- [ ] App matching uses case-insensitive processName comparison
- [ ] First match wins (modes ordered by priority in the array)
- [ ] Returns `null` if no mode matches (use default settings)
- [ ] Typecheck passes

### US-404: Apply Power Mode at recording start
**Description:** As a user, I want VoxGen to automatically detect my current app and apply the right settings when I start recording.

**Acceptance Criteria:**
- [ ] When recording starts, main process calls `getActiveWindowInfo()` then `matchPowerMode()`
- [ ] If a Power Mode matches: temporarily override active prompt, STT provider, cleanup provider, auto-send
- [ ] Overrides last only for this recording session (revert after transcription completes)
- [ ] Overlay shows the matched Power Mode's emoji/name briefly (toast or icon change)
- [ ] If no mode matches, use default settings (existing behavior)
- [ ] If `powerModesEnabled` is false, skip matching entirely
- [ ] Typecheck passes

### US-405: Power Modes management page
**Description:** As a user, I want a UI to create and manage Power Modes.

**Acceptance Criteria:**
- [ ] New section in Settings or dedicated page: "Power Modes"
- [ ] Master toggle: "Enable Power Modes" (off by default)
- [ ] List view showing all modes (emoji + name + matched apps + prompt)
- [ ] "Add Mode" button opens create dialog
- [ ] Edit/delete buttons on each mode
- [ ] Drag-to-reorder for priority
- [ ] Typecheck passes

### US-406: Power Mode create/edit dialog
**Description:** As a user, I want a dialog to configure a Power Mode.

**Acceptance Criteria:**
- [ ] Fields: Name (text), Emoji (text/picker), Apps (multi-select or text input for process names), URL Patterns (text list), Prompt (dropdown of CustomPrompts), STT Provider (dropdown, optional override), Auto-Send (toggle)
- [ ] "Detect Current App" button that auto-fills processName from the currently active window
- [ ] Save and Cancel buttons
- [ ] Validation: name required, at least one app or URL matcher required
- [ ] Typecheck passes

---

## Phase 5: Overlay Fix + Polish + Launch

### US-501: Non-focus-stealing overlay
**Description:** As a user, I want the overlay to never steal keyboard focus from my active application.

**Acceptance Criteria:**
- [ ] Overlay BrowserWindow created with `focusable: false` by default
- [ ] Microphone permission pre-granted on first app launch (or via main window)
- [ ] If `focusable: false` breaks MediaRecorder, use workaround: start recording from main process (not renderer), or temporarily set `focusable: true` only during permission grant
- [ ] Verify: clicking overlay buttons does NOT shift focus from the user's active app
- [ ] Test on Windows 10 and 11
- [ ] Typecheck passes

### US-502: Overlay visual refresh
**Description:** As a user, I want a cleaner, more modern overlay that shows useful status at a glance.

**Acceptance Criteria:**
- [ ] Idle state shows: mic icon + active prompt icon + Power Mode indicator (if active)
- [ ] Recording state shows: pulsing waveform + duration timer + stop/cancel buttons
- [ ] Processing state shows: spinner + "Transcribing..." / "Enhancing..." status text
- [ ] Smooth transitions between states (fade/slide, not instant swap)
- [ ] Rounded pill shape (similar to Competitor's 184x60 design)
- [ ] Typecheck passes

### US-503: Update landing page for v3.0
**Description:** As a marketer, I need the website updated with v3.0 features for the launch.

**Acceptance Criteria:**
- [ ] Feature section highlighting: Smart Cleanup Pipeline, Context-Aware AI, Custom Prompts, Power Modes
- [ ] Comparison table vs Wispr Flow and Competitor
- [ ] Updated download link to v3.0 installer
- [ ] "What's New in v3.0" section
- [ ] Updated pricing (if changed)

---

## Functional Requirements

### Cleanup Pipeline
- **FR-1:** The system must run a 7-stage cleanup pipeline in order: hallucination filter → filler removal → paragraph formatting → word replacements → trigger detection → AI enhancement → output filter
- **FR-2:** Each pipeline stage must be independently skippable via user settings
- **FR-3:** Stages 1-4 and 7 must run even when cleanup provider is "none"
- **FR-4:** The hallucination filter must remove `[text]`, `(text)`, `{text}`, and `<TAG>...</TAG>` patterns via regex
- **FR-5:** The output filter must remove `<thinking>`, `<think>`, and `<reasoning>` tag blocks from AI responses
- **FR-6:** Trigger word detection must check both start AND end of transcript text

### Context Enhancement
- **FR-7:** The system must capture clipboard text content at the moment recording starts
- **FR-8:** The system must capture the active window title and process name at recording start
- **FR-9:** Context data must be injected into the AI system prompt using XML-style tags
- **FR-10:** The system must maintain a user-editable custom vocabulary list (max 200 words)
- **FR-11:** Custom vocabulary must be injected into the AI prompt with instructions to prioritize its spelling

### Custom Prompts
- **FR-12:** Users must be able to create, edit, and delete custom AI prompts
- **FR-13:** Each prompt must support: title, icon (emoji), description, prompt text, trigger words, system instruction toggle
- **FR-14:** The app must ship with 4 predefined prompts: Default, Chat, Email, Rewrite
- **FR-15:** Trigger words from custom prompts must integrate with the cleanup pipeline's trigger detection stage
- **FR-16:** Users must be able to switch active prompt from the overlay without opening the main window

### Power Modes
- **FR-17:** The system must detect the active application and browser URL when recording starts
- **FR-18:** Power Modes must match against configured app process names and URL patterns
- **FR-19:** A matched Power Mode must temporarily override: active prompt, STT provider, cleanup provider, auto-send behavior
- **FR-20:** Overrides must revert to defaults after transcription completes
- **FR-21:** Power Modes must have a master enable/disable toggle (off by default)

### Overlay
- **FR-22:** The overlay window must not steal keyboard focus from the user's active application
- **FR-23:** The overlay must display the current prompt icon and Power Mode indicator

## Non-Goals (Out of Scope for v3.0)

- **No screen OCR / window content extraction** — Clipboard + window title is sufficient. Full OCR requires native modules (Tesseract, Windows OCR API) and is disproportionate effort for marginal gain.
- **No streaming transcription** — Batch transcription is fine for dictation use cases. Streaming adds complexity (WebSocket state, partial results UI) without clear user demand.
- **No per-mode hotkeys** — Competitor supports different hotkeys per Power Mode. Skip for v3.0; the global hotkey system works.
- **No local LLM for cleanup** — node-llama-cpp is still experimental. Stick with cloud providers for AI enhancement.
- **No macOS/Linux support** — Windows-first for v3.0. Cross-platform later.
- **No prompt sharing/marketplace** — Users can't share prompts with others yet.
- **No AI model selection per prompt** — All prompts use the same cleanup provider. Per-prompt model selection is future scope.
- **No selected text context** — Competitor reads selected text via accessibility APIs. This requires platform-specific native modules and is out of scope.

## Technical Considerations

### Architecture Changes
- **New `src/lib/cleanup/pipeline.ts`** becomes the single entry point for all text processing, replacing direct provider calls in hooks
- **`src/lib/cleanup/system-prompts.ts`** centralizes all prompt templates (currently scattered across provider files)
- **`electron/main/active-window.ts`** new service for window detection (main process only — renderer can't access this)
- **Custom prompts stored in electron-store** (not a separate database) — keeps it simple, exports/imports via JSON

### IPC Channels (New)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `clipboard:read` | renderer→main | Read current clipboard text |
| `window:get-active-info` | renderer→main | Get active window title + process name |
| `prompts:get-all` | renderer→main | Get all custom prompts |
| `prompts:save` | renderer→main | Save a custom prompt |
| `prompts:delete` | renderer→main | Delete a custom prompt |
| `prompts:set-active` | renderer→main | Set the active prompt ID |
| `power-modes:get-all` | renderer→main | Get all Power Modes |
| `power-modes:save` | renderer→main | Save a Power Mode |
| `power-modes:match` | renderer→main | Match current window to a Power Mode |

### Dependencies (No New Native Modules)
- Active window detection via `@nut-tree-fork/nut-js` (already installed) or PowerShell fallback
- No new native dependencies — everything uses existing Electron APIs + nut.js
- Emoji picker: simple text input (no library needed)

### Migration
- v2.x users upgrading to v3.0: existing settings preserved, 4 predefined prompts auto-created, existing keyword triggers migrated to custom prompt trigger words
- Existing cleanup prompt replaced silently (no user action needed)

### Performance
- Pipeline stages 1-4 are pure regex/string operations — sub-millisecond, no concern
- Active window detection cached for 500ms — prevents spam during rapid key events
- Custom prompts loaded from electron-store on app start, cached in memory
- Power Mode matching is O(n) where n = number of modes (typically <10)

## Success Metrics

- **Cleanup quality:** Users report fewer cases of AI "answering" their dictated questions
- **Feature adoption:** >30% of active users enable at least one custom prompt within 30 days
- **Power Modes:** >15% of active users configure at least one Power Mode
- **Marketing:** v3.0 launch drives 2x download rate vs v2.x baseline
- **Retention:** 7-day retention improves by 20% (better first-use experience from pipeline improvements)

## Open Questions

1. **Overlay focusable: false** — Does Electron's `focusable: false` break `MediaRecorder` in the overlay renderer? Need to test. Fallback: move audio capture to main process via `desktopCapturer` or a hidden window.
2. **Browser URL extraction** — Window titles don't always contain the full URL. Chrome shows "Page Title - Google Chrome". Should we attempt accessibility API or just use the title text as-is?
3. **Custom prompt sync** — Should custom prompts sync to the cloud (for Pro users with multiple devices)? Or is local-only fine for v3.0?
4. **Power Mode detection latency** — How fast is `getActiveWindow()` on Windows? If >100ms, it could add noticeable delay to recording start. Need to benchmark.
5. **Migration of existing generation templates** — The current email/code/summary/expand templates are generation modes (not cleanup modes). Should they become CustomPrompts with `useSystemInstructions: false`, or stay as a separate generation system?
