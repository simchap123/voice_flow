import { useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/useToast'
import { X, Plus, GripVertical } from 'lucide-react'

export function EnhancementSection() {
  const { settings, updateSetting } = useSettings()

  // Custom vocabulary local state for adding words
  const [vocabInput, setVocabInput] = useState('')

  // Word replacement local state for adding pairs
  const [replOriginal, setReplOriginal] = useState('')
  const [replReplacement, setReplReplacement] = useState('')

  // ── Custom Vocabulary helpers ──────────────────────────────────────────
  function addVocabWords() {
    const words = vocabInput
      .split(',')
      .map(w => w.trim())
      .filter(w => w.length > 0)

    if (words.length === 0) return

    const current = settings.customVocabulary ?? []
    const next = [...new Set([...current, ...words])]

    if (next.length > 200) {
      toast({ title: 'Vocabulary limit reached', description: 'Maximum 200 words allowed.', variant: 'destructive' })
      return
    }

    updateSetting('customVocabulary', next)
    setVocabInput('')
    toast({ title: `Added ${words.length} word${words.length > 1 ? 's' : ''}`, variant: 'success' })
  }

  function removeVocabWord(word: string) {
    updateSetting('customVocabulary', (settings.customVocabulary ?? []).filter(w => w !== word))
  }

  // ── Word Replacement helpers ───────────────────────────────────────────
  function addReplacement() {
    const orig = replOriginal.trim()
    const repl = replReplacement.trim()
    if (!orig || !repl) return

    const current = settings.wordReplacements ?? []
    updateSetting('wordReplacements', [...current, { original: orig, replacement: repl, enabled: true }])
    setReplOriginal('')
    setReplReplacement('')
    toast({ title: 'Replacement added', variant: 'success' })
  }

  function removeReplacement(idx: number) {
    const next = [...(settings.wordReplacements ?? [])]
    next.splice(idx, 1)
    updateSetting('wordReplacements', next)
  }

  function toggleReplacement(idx: number, enabled: boolean) {
    const next = [...(settings.wordReplacements ?? [])]
    next[idx] = { ...next[idx], enabled }
    updateSetting('wordReplacements', next)
  }

  const vocab = settings.customVocabulary ?? []
  const replacements = settings.wordReplacements ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AI Enhancement</h2>
        <p className="text-sm text-muted-foreground">Context injection, vocabulary, and text transformations</p>
      </div>

      {/* Context Injection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Context Injection</CardTitle>
          <CardDescription>
            Capture what you're doing when you start recording — gives the AI better context for cleanup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Clipboard context</Label>
              <p className="text-xs text-muted-foreground">
                Reads clipboard at recording start — AI uses it to fix names, terms, and phrasing
              </p>
            </div>
            <Switch
              checked={settings.useClipboardContext ?? true}
              onCheckedChange={(v) => updateSetting('useClipboardContext', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active window context</Label>
              <p className="text-xs text-muted-foreground">
                Detects which app you're dictating into (Gmail, Slack, VS Code…) for better formatting
              </p>
            </div>
            <Switch
              checked={settings.useWindowContext ?? true}
              onCheckedChange={(v) => updateSetting('useWindowContext', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filler Word Removal */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Cleanup Options</CardTitle>
          <CardDescription>Pre-processing applied before AI cleanup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Filler word removal</Label>
              <p className="text-xs text-muted-foreground">
                Strip "um", "uh", "like", "you know", etc. before sending to AI
              </p>
            </div>
            <Switch
              checked={settings.fillerWordRemoval ?? false}
              onCheckedChange={(v) => updateSetting('fillerWordRemoval', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Vocabulary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Custom Vocabulary</CardTitle>
          <CardDescription>
            Proper nouns, jargon, and technical terms — the AI will prioritize these spellings ({vocab.length}/200)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add words, comma-separated (e.g. Supabase, VoxGen, GPT-4o)"
              value={vocabInput}
              onChange={(e) => setVocabInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addVocabWords() }}
              className="text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addVocabWords}
              disabled={!vocabInput.trim()}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {vocab.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {vocab.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs font-medium"
                >
                  {word}
                  <button
                    onClick={() => removeVocabWord(word)}
                    className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">No words added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Word Replacements */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Word Replacements</CardTitle>
          <CardDescription>
            Auto-correct specific words or phrases before AI cleanup. Supports comma-separated variants.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Original (or variants: colour, color)"
              value={replOriginal}
              onChange={(e) => setReplOriginal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addReplacement() }}
              className="text-sm"
            />
            <span className="text-muted-foreground shrink-0 text-sm">→</span>
            <Input
              placeholder="Replacement"
              value={replReplacement}
              onChange={(e) => setReplReplacement(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addReplacement() }}
              className="text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addReplacement}
              disabled={!replOriginal.trim() || !replReplacement.trim()}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {replacements.length > 0 ? (
            <div className="space-y-1.5">
              {replacements.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                  <span className={`text-xs font-mono flex-1 ${!r.enabled ? 'line-through text-muted-foreground/50' : ''}`}>
                    <span className="text-muted-foreground">{r.original}</span>
                    <span className="mx-1.5 text-muted-foreground/50">→</span>
                    <span>{r.replacement}</span>
                  </span>
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(v) => toggleReplacement(idx, v)}
                    className="scale-75"
                  />
                  <button
                    onClick={() => removeReplacement(idx)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">No replacements added yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
