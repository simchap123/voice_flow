# VoxGen vs Wispr Flow — Competitive Analysis

## Date: February 9, 2026

---

## Wispr Flow Overview

- **Valuation:** $700M post-money ($81M total funding)
- **Growth:** 40% month-over-month, 270 Fortune 500 companies
- **Platform:** Mac (Sept 2024), Windows (March 2025), iOS (June 2025)
- **Architecture:** Two-stage pipeline — ASR → fine-tuned Meta Llama LLM cleanup
- **Infrastructure:** Baseten (TensorRT-LLM) on AWS, <700ms end-to-end latency
- **Key Metric:** 90% of dictated text requires zero edits

## Wispr Flow Pricing

| Plan | Price | Features |
|------|-------|---------|
| Flow Basic (Free) | $0 | 2,000 words/week, AI auto-editing, personal dictionary |
| Flow Pro | $15/mo ($12/mo annual) | Unlimited words, Command Mode |
| Teams | Custom (3+ users) | Collaborative features |
| Enterprise | Custom | SSO, zero data retention, compliance |

## Wispr Flow Features

### Core
- Hold-to-talk global hotkey dictation
- Universal app compatibility (25,000+ apps)
- 100+ languages with on-the-fly switching
- Self-correction understanding ("I mean...")
- Filler word removal (um, uh, etc.)
- Auto-punctuation and formatting
- Context-aware tone (formal for email, casual for chat)
- Personal dictionary (learns jargon, acronyms)
- Whisper Mode (low volume for public spaces)

### Pro Features
- Command Mode: Highlight text + voice commands ("make this formal", "translate to Spanish")
- Voice shortcuts/snippets
- Perplexity AI integration
- Vibe coding (Cursor, Windsurf, Replit IDE integration)

### What Wispr Flow Does NOT Have
- No BYOK (Bring Your Own Key)
- No offline/local processing
- No content generation from prompts
- No templates or structured output
- No long-form content transformation
- No lifetime pricing option

---

## VoxGen Current State (v1.3.0)

### Tech Stack
- Electron 33 + React 19 + TypeScript 5.7 + Vite 6
- Tailwind CSS 3 + shadcn/ui
- electron-store 8 (ESM) + vite-plugin-electron
- @nut-tree-fork/nut-js (text injection)
- uiohook-napi (global keyboard hooks)

### Existing Features
- Hold/Toggle/Prompt recording modes
- Global hotkey dictation (Alt/Ctrl/Shift/Super)
- Two-window architecture (main + overlay)
- OpenAI Whisper + Groq Whisper STT
- GPT-4o-mini + Groq Llama 3.3 cleanup
- Code Mode (speech → code)
- Prompt Mode (AI content generation — foundation exists)
- Text snippets with trigger expansion
- Searchable transcription history
- Multi-language support (40+)
- Dark/light theme
- API key encryption (Electron safeStorage)
- Licensing (Supabase + Stripe): Free BYOK, Pro $8/mo, Yearly $48, Lifetime $39

### Codebase
- ~5,300 LOC (3,949 React/TS + 1,385 Electron)
- 28 React components, 10 custom hooks
- Clean provider pattern (easy to extend)
- Well-documented (ARCHITECTURE.md, PRD.md, BACKEND_ARCHITECTURE.md)

---

## Head-to-Head Comparison

| Feature | VoxGen | Wispr Flow |
|---------|-----------|------------|
| **Dictation** | Hold/Toggle/Prompt modes | Hold-to-talk |
| **STT Providers** | OpenAI + Groq + Local (planned) | Proprietary (Meta Llama) |
| **AI Cleanup** | GPT-4o-mini + Llama 3.3 | Fine-tuned Llama |
| **Content Generation** | Prompt Mode (basic) | None |
| **Code Mode** | Yes | Vibe coding (IDE only) |
| **BYOK** | Yes (free tier) | No |
| **Offline Mode** | Planned (local whisper) | No |
| **Privacy** | Local processing option | Cloud-only |
| **Platform** | Windows (Electron) | Mac-first, Windows, iOS |
| **Pricing** | Free BYOK / $8mo / $39 lifetime | Free 2K words / $15mo |
| **RAM Usage** | ~200-300MB | ~800MB |
| **Languages** | 40+ | 100+ |
| **Self-correction** | Not yet | Yes ("I mean...") |
| **Command Mode** | Not yet | Yes (Pro) |
| **Personal Dictionary** | Not yet | Yes |
| **App Detection** | Not yet | Yes (context-aware tone) |
| **Snippets** | Yes (trigger expansion) | Yes (voice cues) |
| **Text Injection** | nut-js + clipboard | Native |

---

## VoxGen Competitive Advantages

1. **BYOK / Privacy-first** — Use your own API keys, no subscription required
2. **Offline capability** — Local Whisper processing (planned)
3. **Aggressive pricing** — $39 lifetime vs $15/month
4. **Windows-first** — Most competitors are Mac-only
5. **Open provider architecture** — Easy to add new STT/LLM providers
6. **Content generation** — Prompt Mode foundation already exists

## Key Gaps to Close

1. **Content generation with keyword triggers** — Expand Prompt Mode
2. **Adjustable output length** — "Short", "Medium", "Detailed" controls
3. **Command Mode** — Voice-edit highlighted text
4. **Self-correction** — "I mean..." handling
5. **Personal dictionary** — Learn user vocabulary
6. **Context-aware formatting** — Detect target app
7. **More languages** — Expand from 40+ to 100+
8. **Prompt enhancement** — Speak rough idea → AI creates better prompt

---

## Competitor Landscape

### Direct Competitors (Desktop Dictation)
| Product | Privacy | Platform | Price | Differentiator |
|---------|---------|----------|-------|---------------|
| Wispr Flow | Cloud-only | Mac/Win/iOS | $15/mo | Best accuracy, widest support |
| Aqua Voice | Cloud | Mac/Win | $8/mo | 50ms launch, real-time overlay |
| Superwhisper | Local | Mac/iOS | $250 lifetime | Apple Silicon optimized, offline |
| VoiceInk | Local | Mac | Free/$39 | Open-source (GPL) |
| Voibe | Local | Mac | $99 lifetime | 100% offline, 150MB RAM |
| BetterDictation | Both | Mac | $39 lifetime | Dual-tier privacy |

### Content Generation (Voice-to-Content)
| Product | What It Does | Platform |
|---------|-------------|----------|
| AudioPen | Voice notes → organized text/essays | Web/Mobile |
| TalkNotes | Dictation → structured content | Web/Mobile |
| Typeless | Dictation → coherent prose | Web |

**Market gap:** No desktop app combines excellent dictation WITH content generation. This is VoxGen's opportunity.

---

## Framework Decision

**Decision: Stay with Electron.**

| Framework | Bundle | RAM | Migration Cost | Verdict |
|-----------|--------|-----|---------------|---------|
| Electron (current) | 86MB | 200-300MB | None | Keep |
| Tauri 2 | 0.6-10MB | 30-40MB | 3-6 weeks, Rust rewrite | Not now |
| Flutter Desktop | 15-25MB | 60-120MB | Full Dart rewrite | Not now |
| Wails | 4-8MB | 30-50MB | Full Go rewrite | No |
| Neutralinojs | 0.5-2MB | 20-30MB | Missing critical APIs | No |

**Rationale:** All features work today. Migration costs outweigh bundle/RAM savings. Focus on features, not framework.

**Future consideration:** If starting a new project or adding mobile, Flutter or Tauri 2 worth evaluating.

---

## Naming Note

Rebranded from "VoiceFlow" to "VoxGen" to avoid conflict with VoiceFlow.com (a conversational AI platform for building voice/chat bots). VoxGen reflects the app's expanded focus on voice-driven smart content generation beyond simple dictation.
