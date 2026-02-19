# VoxGen UI/UX Recommendations — Simplification Plan

## Executive Summary

**Current state:** 12 nav items, 100+ buttons, overlapping controls, duplicated settings
**Target state:** 6 nav items, ~40 core buttons, single source of truth per setting

---

## 🔴 CRITICAL: Eliminate Duplicates

### 1. **Hotkeys: 4 → 3 (keep the useful ones)**

**CURRENT PROBLEM:**
- Hold-to-Record hotkey + Change + Clear
- Toggle hotkey + Change + Clear
- AI Prompt hotkey + Change + Clear (rarely used)
- Double-Tap hotkey + Change + Clear

= **8 buttons total**, cluttered UI

**SOLUTION:**
Keep Hold, Toggle, and Double-Tap. Remove AI Prompt (niche use case).

```
┌─ Recording Hotkeys ────────────────┐
│ Hold to record:                    │
│   Alt                   [Change]   │
│                                    │
│ Toggle recording:                  │
│   Ctrl+Shift+V          [Change]   │
│                                    │
│ Double-tap to toggle:              │
│   Ctrl                  [Change]   │
│   Press the same key twice quickly │
└────────────────────────────────────┘
```

**BENEFIT:**
- 8 buttons → 6 buttons
- Clear labels explain each mode
- Double-tap help text: "Press the same key twice quickly"
- User can set ANY key for double-tap (Ctrl, Shift, Alt, Ctrl+V, etc.)

---

### 2. **Provider Overrides: Remove from Power Modes**

**CURRENT PROBLEM:**
- STT provider set in: Providers section + Power Modes per-mode override
- Cleanup provider set in: Providers section + Power Modes per-mode override
- Prompt set in: Prompts section + Overlay picker + Power Modes per-mode override

**SOLUTION:**
Power Modes should **only** change the active Prompt. Remove STT/Cleanup overrides.

**REASONING:**
- Power Modes are for **context-specific cleanup styles** (Email vs Chat vs Code)
- STT provider is a **global infrastructure choice** (OpenAI vs Groq vs Local)
- Mixing infrastructure with content style creates confusion

**NEW Power Mode form:**
```
┌─ Edit Power Mode ──────────────────┐
│ Name:  📧 Email Mode               │
│ Apps:  outlook, thunderbird        │
│ URLs:  mail.google.com             │
│                                    │
│ Prompt: [Email Cleanup ▼]          │
│                                    │
│         [Save]  [Cancel]           │
└────────────────────────────────────┘
```

**BENEFIT:** 6 fields → 4 fields per mode, clearer purpose

---

### 3. **Filler Word Removal: Redundant with Default Cleanup**

**CURRENT PROBLEM:**
- Enhancement → Filler Word Removal toggle
- system-prompts.ts → Default Cleanup already says "Remove filler words"

**SOLUTION:** Delete the toggle. Filler removal is **always on** in cleanup prompts.

**BENEFIT:** One less toggle, one less decision

---

### 4. **Email Input: Account only**

**CURRENT PROBLEM:**
- Account → Set Email
- Website checkout modal → Email input

**SOLUTION:** Remove from Account section. Email is only captured on website checkout.

**BENEFIT:** One less redundant input field

---

## 🟡 MERGE: Combine Overlapping Sections

### **Providers + Enhancement → "AI Processing"**

**CURRENT SPLIT:**
- **Providers:** STT provider, Cleanup provider, API keys, Code Mode, Keyword Triggers, Output Length, Prompt Refinement
- **Enhancement:** Clipboard context, Window context, Filler removal, Vocabulary, Word replacements

**PROBLEM:** "Code Mode" and "Keyword Triggers" have nothing to do with API providers. They're processing options.

**NEW STRUCTURE:**

```
Settings
├─ Recording          (Hotkeys, Mic, Language, Auto-paste)
├─ AI Processing      (Providers, API Keys, Context, Vocabulary, Replacements)
├─ Prompts            (Predefined + Custom prompts)
├─ Power Modes        (Context-based prompt switching)
└─ Account            (License, Usage, Updates)
```

---

## 🟢 NEW SIDEBAR STRUCTURE

### Before (12 items):
```
Sidebar:
├─ Dictation
├─ History
├─ Snippets
├─ What's New
└─ Settings
    ├─ General
    ├─ Providers
    ├─ Enhancement
    ├─ Prompts
    ├─ Power Modes
    ├─ Account
    └─ About
```

### After (6 items):
```
Sidebar:
├─ History
├─ Snippets
└─ Settings
    ├─ Recording
    ├─ AI Processing
    ├─ Prompts
    ├─ Power Modes
    └─ Account
```

**CHANGES:**
1. ❌ **Cut "Dictation"** — Empty page, serves no purpose (user dictates via overlay)
2. ❌ **Cut "What's New"** — Move to Settings → Account → "What's New" link
3. ❌ **Cut "About"** — Merge into Account (version, updates live there anyway)
4. ✅ **Merge General + Providers + Enhancement** → Recording + AI Processing

---

## 📋 DETAILED SETTINGS BREAKDOWN

### 🎙️ **Recording** (was General)
```
┌─ Recording Hotkeys ────────────────┐
│ Hold to record:                    │
│   Alt                   [Change]   │
│                                    │
│ Toggle recording:                  │
│   Ctrl+Shift+V          [Change]   │
│                                    │
│ Double-tap to toggle:              │
│   Ctrl                  [Change]   │
│   Press the same key twice quickly │
└────────────────────────────────────┘

┌─ Microphone & Language ────────────┐
│ Device:    [Default ▼]             │
│ Language:  [English (US) ▼]        │
└────────────────────────────────────┘

┌─ Preferences ──────────────────────┐
│ ☑ Auto-paste after transcription   │
│ Theme: ◉ Dark  ○ Light  ○ System   │
└────────────────────────────────────┘
```

**Removed:**
- AI Prompt hotkey (niche, confusing)

---

### 🤖 **AI Processing** (merged Providers + Enhancement)

**Section 1: Providers & Keys**
```
┌─ Speech Recognition ───────────────┐
│ ◉ OpenAI Whisper                   │
│ ○ Groq Whisper (faster, cheaper)   │
│ ○ Local (offline, free)            │
└────────────────────────────────────┘

┌─ AI Cleanup ───────────────────────┐
│ ☑ Enable cleanup                   │
│ ◉ OpenAI GPT-4o-mini               │
│ ○ Groq Llama 3.3                   │
└────────────────────────────────────┘

┌─ API Keys ─────────────────────────┐
│ OpenAI:  ••••••••  [Update] [✓]   │
│ Groq:    (not set) [Add Key]       │
└────────────────────────────────────┘
```

**Section 2: Processing Options**
```
┌─ Options ──────────────────────────┐
│ ☑ Code syntax conversion           │
│ ☑ Keyword triggers (generate...)   │
│ ☑ Prompt refinement                │
│                                    │
│ Output: ◉ Concise ○ Medium ○ Long  │
└────────────────────────────────────┘
```

**Section 3: Context & Vocabulary**
```
┌─ Context Injection ────────────────┐
│ ☑ Clipboard content                │
│ ☑ Active window name               │
└────────────────────────────────────┘

┌─ Custom Vocabulary ────────────────┐
│ [VoxGen] [API] [Groq]    [+ Add]   │
└────────────────────────────────────┘

┌─ Word Replacements ────────────────┐
│ ☑ "gonna" → "going to"   [×]       │
│ ☑ "wanna" → "want to"    [×]       │
│   [original] → [replacement] [Add] │
└────────────────────────────────────┘
```

**Removed:**
- Filler Word Removal toggle (redundant)

---

### ✨ **Prompts** (unchanged)
Keep as-is. Clean, functional.

---

### ⚡ **Power Modes** (simplified)
```
┌─ Power Modes ──────────────────────┐
│ ☑ Enable context-based prompts     │
└────────────────────────────────────┘

┌─ 📧 Email Mode ────────────────────┐
│ Apps:    outlook, gmail            │
│ Prompt:  Email Cleanup             │
│          [Edit] [Delete]           │
└────────────────────────────────────┘
```

**Removed:**
- STT provider override
- Cleanup provider override

---

### 👤 **Account** (merged About)
```
┌─ Usage ────────────────────────────┐
│ 📝 12,450 words dictated           │
│ ⏱️ 2h 14m recorded                 │
└────────────────────────────────────┘

┌─ License ──────────────────────────┐
│ Trial: 23 days left                │
│ [Manage Subscription]              │
└────────────────────────────────────┘

┌─ App Info ─────────────────────────┐
│ Version 2.9.0                      │
│ [Check for Updates]                │
│ [What's New]                       │
└────────────────────────────────────┘
```

**Added:**
- "What's New" link (was a full page)

**Removed:**
- Set Email input (only on website)
- Clear License button (use Manage Subscription portal)

---

## 🎯 BEFORE/AFTER METRICS

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Sidebar nav items** | 5 | 3 | -40% |
| **Settings tabs** | 7 | 5 | -29% |
| **Hotkey buttons** | 8 | 6 | -25% |
| **Provider controls** | 15 | 10 | -33% |
| **Total toggles** | 12 | 8 | -33% |
| **Duplicate settings** | 6 | 0 | -100% |

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1: Critical Dedupe (1-2 hours)
1. Remove Power Modes STT/Cleanup overrides
2. Delete Filler Word Removal toggle
3. Merge General + Providers + Enhancement → Recording + AI Processing
4. Update SettingsNav to 5 tabs

### Phase 2: Sidebar Simplification (30 min)
1. Remove Dictation page
2. Remove What's New page, add link to Account
3. Merge About into Account

### Phase 3: Hotkey Simplification (30 min)
1. Remove AI Prompt hotkey (rarely used)
2. Add help text to Double-Tap: "Press the same key twice quickly"
3. Update hotkey card layout for clarity

### Phase 4: Polish (30 min)
1. Update navigation icons
2. Adjust section spacing
3. Test all settings persist correctly

---

## ✅ EXPECTED OUTCOME

**Cognitive Load:**
- Users see 5 clear categories instead of 12 scattered items
- No more "Where do I find X?" confusion
- Each setting has ONE location

**Visual Clarity:**
- Less scrolling (fewer sections)
- Tighter grouping of related controls
- Reduced button clutter

**Maintainability:**
- Single source of truth per setting
- Easier to add new features (clear categories)
- Fewer edge cases to test
