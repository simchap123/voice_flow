# VoxGen UI/UX Redesign — Complete Change Manifest

**Status:** PENDING APPROVAL
**Date:** 2026-02-18

---

## 🎨 VISUAL DESIGN CHANGES (New Colors & Style)

### Current Theme
- Primary: Purple (`#9333ea`, `#a855f7`, `#c084fc`)
- Background: Dark slate (`#0a0e1a`, `#1e293b`)
- Accent: Purple gradient
- Glass effects: `bg-white/10`, `border-white/8`

### Proposed New Theme
**Option A: Indigo/Blue (Professional, Modern)**
- Primary: Indigo (`#4f46e5`, `#6366f1`, `#818cf8`)
- Secondary: Sky blue (`#0ea5e9`, `#38bdf8`)
- Background: Darker navy (`#0f172a`, `#1e293b`)
- Accent: Blue-violet gradient
- Glass: `bg-blue-500/10`, `border-blue-400/20`

**Option B: Emerald/Green (Fresh, Energetic)**
- Primary: Emerald (`#059669`, `#10b981`, `#34d399`)
- Secondary: Teal (`#14b8a6`, `#2dd4bf`)
- Background: Deep green-black (`#0a1512`, `#1e2d27`)
- Accent: Green gradient
- Glass: `bg-emerald-500/10`, `border-emerald-400/20`

**Option C: Amber/Orange (Warm, Energetic)**
- Primary: Amber (`#d97706`, `#f59e0b`, `#fbbf24`)
- Secondary: Orange (`#ea580c`, `#fb923c`)
- Background: Dark brown-black (`#1c1510`, `#2d2416`)
- Accent: Warm gradient
- Glass: `bg-amber-500/10`, `border-amber-400/20`

**Files affected:**
- `src/index.css` (CSS variables)
- `tailwind.config.js` (theme colors)
- All component files (class names: `bg-purple-*` → `bg-indigo-*`)

---

## 📂 STRUCTURAL CHANGES (Navigation & Organization)

### Sidebar Navigation

#### BEFORE (5 items)
```
src/components/layout/Sidebar.tsx:
- Dictation
- History
- Snippets
- What's New
- Settings
```

#### AFTER (3 items)
```
src/components/layout/Sidebar.tsx:
- History
- Snippets
- Settings
```

**Changes:**
1. ❌ Remove "Dictation" nav item (empty page, no content)
2. ❌ Remove "What's New" nav item (moved to Settings → Account → link)

**Files deleted:**
- `src/pages/DictationPage.tsx` (if exists)
- `src/pages/WhatsNewPage.tsx`

**Files modified:**
- `src/components/layout/Sidebar.tsx` (remove 2 nav items)
- `src/App.tsx` or routing file (remove routes)

---

### Settings Tabs

#### BEFORE (7 tabs)
```
src/components/settings/SettingsNav.tsx:
1. General
2. Providers
3. Enhancement
4. Prompts
5. Power Modes
6. Account
7. About
```

#### AFTER (5 tabs)
```
src/components/settings/SettingsNav.tsx:
1. Recording (merge General)
2. AI Processing (merge Providers + Enhancement)
3. Prompts (unchanged)
4. Power Modes (simplified)
5. Account (merge About)
```

**Files renamed:**
- `src/components/settings/GeneralSection.tsx` → `RecordingSection.tsx`

**Files merged:**
- `ProvidersSection.tsx` + `EnhancementSection.tsx` → `AIProcessingSection.tsx`
- `AboutSection.tsx` content → moved into `AccountSection.tsx`

**Files deleted:**
- `src/components/settings/AboutSection.tsx`
- `src/components/settings/EnhancementSection.tsx`

**Files modified:**
- `src/components/settings/SettingsNav.tsx` (7 tabs → 5 tabs)
- `src/pages/SettingsPage.tsx` (update section mapping)

---

## 🔧 FEATURE CHANGES (What Gets Cut/Merged)

### 1. Hotkeys (3 modes with configurable triggers)

#### BEFORE
```tsx
// GeneralSection.tsx
<HotkeyRecorder label="Hold-to-Record" />  // Alt
<HotkeyRecorder label="Toggle Hotkey" />   // Ctrl+Shift+V
<HotkeyRecorder label="AI Prompt Hotkey" /> // Ctrl
<HotkeyRecorder label="Double-Tap Hotkey" /> // Ctrl (double-tap)
```

#### AFTER
```tsx
// RecordingSection.tsx
<HotkeyModeSelector
  mode="Hold-to-Record"
  key="Alt"
  triggerMethod="hold" // or "single" or "double-tap"
/>
<HotkeyModeSelector
  mode="Toggle Recording"
  key="Ctrl+V"
  triggerMethod="single" // or "double-tap"
/>
<HotkeyModeSelector
  mode="AI Prompt"
  key="Ctrl"
  triggerMethod="double-tap" // or "single"
/>
```

**What changes:**
- 4 separate hotkey inputs → 3 mode cards
- Each mode has: Key recorder + Trigger method radio buttons
- ❌ Remove standalone "Double-Tap Hotkey" (becomes trigger method)

**Files affected:**
- `src/components/settings/RecordingSection.tsx` (new component)
- `electron/main/hotkeys.ts` (update trigger detection logic)
- `src/types/settings.ts` (update AppSettings interface)

---

### 2. Power Modes (Remove provider overrides)

#### BEFORE
```tsx
// PowerModesSection.tsx - Mode form
<Input name="emoji" />
<Input name="name" />
<Textarea name="appMatchers" />
<Textarea name="urlMatchers" />
<Select name="promptId" />
<Select name="sttProvider" />      // ❌ REMOVE
<Select name="cleanupProvider" />  // ❌ REMOVE
```

#### AFTER
```tsx
// PowerModesSection.tsx - Mode form
<Input name="emoji" />
<Input name="name" />
<Textarea name="appMatchers" />
<Textarea name="urlMatchers" />
<Select name="promptId" />
// sttProvider and cleanupProvider removed
```

**What changes:**
- ❌ Remove STT Provider override dropdown
- ❌ Remove Cleanup Provider override dropdown
- Power Modes now ONLY switch prompts, not infrastructure

**Files affected:**
- `src/types/power-mode.ts` (remove `sttProvider?`, `cleanupProvider?` fields)
- `src/components/settings/PowerModesSection.tsx` (remove 2 dropdowns)
- `src/hooks/useRecordingState.ts` (remove provider override logic)

---

### 3. Filler Word Removal Toggle (Delete)

#### BEFORE
```tsx
// EnhancementSection.tsx
<Switch label="Filler Word Removal" checked={fillerWordRemoval} />
```

#### AFTER
```
(Removed entirely)
```

**What changes:**
- ❌ Delete toggle from UI
- ❌ Remove from settings store
- Filler removal is always handled by cleanup prompt

**Files affected:**
- `src/types/settings.ts` (remove `fillerWordRemoval: boolean`)
- `electron/main/store.ts` (remove from defaults)
- `src/components/settings/AIProcessingSection.tsx` (delete toggle)
- `src/lib/cleanup/cleanup-pipeline.ts` (remove conditional logic if any)

---

### 4. Account Section (Merge About + What's New)

#### BEFORE
```tsx
// AccountSection.tsx
<UsageStats />
<EmailInput />
<LicenseInput />
<ManageSubscription />
<ClearLicense />

// AboutSection.tsx (separate tab)
<VersionDisplay />
<CheckForUpdates />
<InstallUpdate />
```

#### AFTER
```tsx
// AccountSection.tsx (merged)
<UsageStats />
<LicenseInput />
<ManageSubscription />

// New "App Info" card
<VersionDisplay />
<CheckForUpdates />
<Link to="WhatsNew">What's New</Link>
```

**What changes:**
- ❌ Remove "Set Email" input (only on website)
- ❌ Remove "Clear License" button (use Stripe portal)
- ✅ Merge version/update controls into Account
- ✅ Add "What's New" link (opens modal/page)

**Files affected:**
- `src/components/settings/AccountSection.tsx` (add version card, remove email)
- `src/components/settings/AboutSection.tsx` (delete file)
- `src/components/modals/WhatsNewModal.tsx` (new file for changelog)

---

### 5. AI Processing Section (Merge Providers + Enhancement)

#### Structure
```tsx
// NEW: AIProcessingSection.tsx

// Card 1: Providers
<RadioGroup label="STT Provider">
  <Radio value="openai">OpenAI Whisper</Radio>
  <Radio value="groq">Groq Whisper</Radio>
  <Radio value="local">Local (offline)</Radio>
</RadioGroup>

<Switch label="Enable Cleanup" />
<RadioGroup label="Cleanup Provider" disabled={!cleanupEnabled}>
  <Radio value="openai">OpenAI GPT-4o-mini</Radio>
  <Radio value="groq">Groq Llama 3.3</Radio>
</RadioGroup>

// Card 2: API Keys
<APIKeyInput provider="openai" />
<APIKeyInput provider="groq" />

// Card 3: Processing Options
<Switch label="Code syntax conversion" />
<Switch label="Keyword triggers" />
<Switch label="Prompt refinement" />
<RadioGroup label="Output Length">
  <Radio value="concise">Concise</Radio>
  <Radio value="medium">Medium</Radio>
  <Radio value="detailed">Detailed</Radio>
</RadioGroup>

// Card 4: Context
<Switch label="Clipboard context" />
<Switch label="Active window context" />

// Card 5: Custom Vocabulary
<VocabularyInput />

// Card 6: Word Replacements
<ReplacementsList />
```

**What changes:**
- ✅ Merge ProvidersSection + EnhancementSection
- ❌ Remove Filler Word Removal toggle
- ✅ Reorder: Providers → Options → Context → Vocabulary

**Files affected:**
- `src/components/settings/AIProcessingSection.tsx` (new file)
- `src/components/settings/ProvidersSection.tsx` (delete)
- `src/components/settings/EnhancementSection.tsx` (delete)

---

## 📝 COMPLETE FILE CHANGE LIST

### Files to Delete (7 files)
1. `src/pages/DictationPage.tsx`
2. `src/pages/WhatsNewPage.tsx`
3. `src/components/settings/AboutSection.tsx`
4. `src/components/settings/EnhancementSection.tsx`
5. `src/components/settings/GeneralSection.tsx` (will be recreated as RecordingSection)
6. `src/components/settings/ProvidersSection.tsx` (merged into AIProcessingSection)
7. (Any test files for above components)

### Files to Create (3 files)
1. `src/components/settings/RecordingSection.tsx` (new, replaces GeneralSection)
2. `src/components/settings/AIProcessingSection.tsx` (new, merges Providers + Enhancement)
3. `src/components/modals/WhatsNewModal.tsx` (new, replaces WhatsNewPage)

### Files to Modify (15+ files)

**Navigation & Routing:**
1. `src/components/layout/Sidebar.tsx` (remove 2 nav items)
2. `src/App.tsx` or routing config (remove routes)
3. `src/components/settings/SettingsNav.tsx` (7 tabs → 5 tabs)
4. `src/pages/SettingsPage.tsx` (update section mapping)

**Settings Components:**
5. `src/components/settings/AccountSection.tsx` (merge About content, remove email input)
6. `src/components/settings/PowerModesSection.tsx` (remove provider overrides)
7. `src/components/settings/PromptsSection.tsx` (potentially update styling for new theme)

**Data & Types:**
8. `src/types/settings.ts` (update AppSettings interface)
9. `src/types/power-mode.ts` (remove sttProvider?, cleanupProvider?)
10. `electron/main/store.ts` (update defaults, remove fillerWordRemoval)

**Recording & Hotkeys:**
11. `electron/main/hotkeys.ts` (update trigger detection for new mode system)
12. `src/hooks/useRecordingState.ts` (remove power mode provider overrides)

**Styling (if color change approved):**
13. `src/index.css` (CSS variables for new theme)
14. `tailwind.config.js` (update theme colors)
15. `src/components/**/*.tsx` (update all `bg-purple-*` → `bg-indigo-*` etc.)

---

## 🎯 IMPLEMENTATION STEPS (If Approved)

### Phase 1: Visual Design (Choose Color)
1. **User selects:** Option A (Indigo), B (Emerald), or C (Amber)
2. Update `tailwind.config.js` with new primary/secondary colors
3. Update `src/index.css` CSS variables
4. Search/replace all `purple` color classes → new color

**Estimated time:** 1 hour

---

### Phase 2: Structural Changes (Navigation)
1. Remove Dictation page + route
2. Remove What's New page, create WhatsNewModal
3. Update Sidebar (5 → 3 items)
4. Update SettingsNav (7 → 5 tabs)

**Estimated time:** 30 min

---

### Phase 3: Settings Reorganization
1. Create RecordingSection (new hotkey mode UI)
2. Create AIProcessingSection (merge Providers + Enhancement)
3. Update AccountSection (merge About)
4. Update PowerModesSection (remove provider overrides)
5. Delete old section files

**Estimated time:** 2-3 hours

---

### Phase 4: Data Model Updates
1. Update AppSettings interface
2. Update PowerMode interface
3. Update electron-store defaults
4. Test settings persistence

**Estimated time:** 30 min

---

### Phase 5: Hotkey System Overhaul
1. Update hotkeys.ts for mode-based triggers
2. Update useRecordingState for new provider logic
3. Test all 3 modes × 3 trigger methods

**Estimated time:** 2 hours

---

### Phase 6: Testing & Polish
1. Test all settings save/load correctly
2. Test hotkeys work in all configurations
3. Test power modes with new simplified form
4. Visual QA (spacing, colors, consistency)

**Estimated time:** 1 hour

---

## ⚠️ RISKS & CONSIDERATIONS

### Breaking Changes
- **Hotkey settings format changes** → Need migration logic for existing users
- **Power mode schema changes** → Existing power modes lose provider overrides
- **Removed fillerWordRemoval setting** → No migration needed (cleanup handles it)

### User Impact
- **Learning curve:** Settings are reorganized, users need to find things
- **Lost features:** Email input in Account, provider overrides in Power Modes
- **Mitigation:** Could show one-time "Settings reorganized" notice

### Rollback Plan
- All changes are in version control
- Can revert entire commit if issues arise
- No database migrations (just settings JSON updates)

---

## 📊 SUMMARY

| Category | Added | Modified | Removed |
|----------|-------|----------|---------|
| **Sidebar nav items** | 0 | 1 | 2 |
| **Settings tabs** | 0 | 5 | 2 |
| **Component files** | 3 | 15 | 7 |
| **Settings fields** | 3 (trigger methods) | 8 | 5 |
| **Total LOC changed** | ~800 | ~1500 | ~1200 |

---

## ✅ APPROVAL CHECKLIST

Before proceeding, confirm:

- [ ] Color theme selected (A/B/C or keep purple)
- [ ] OK to remove Dictation page
- [ ] OK to remove What's New page (becomes modal)
- [ ] OK to merge General → Recording
- [ ] OK to merge Providers + Enhancement → AI Processing
- [ ] OK to merge About → Account
- [ ] OK to remove Power Modes provider overrides
- [ ] OK to remove Filler Word Removal toggle
- [ ] OK to remove Email input from Account
- [ ] OK to redesign hotkeys as 3 modes with trigger methods
- [ ] Understand existing users' settings will migrate (hotkeys especially)

---

**AWAITING YOUR APPROVAL TO PROCEED**
