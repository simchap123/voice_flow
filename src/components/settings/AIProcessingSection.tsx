import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { ProviderApiKeyInput } from '@/components/settings/ProviderApiKeyInput'
import { LocalModelManager } from '@/components/settings/LocalModelManager'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/useToast'
import { Cloud, X, Plus, GripVertical } from 'lucide-react'
import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType, OutputLength } from '@/lib/cleanup/types'

const OUTPUT_LENGTHS: { value: OutputLength; label: string; description: string }[] = [
  { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
  { value: 'medium', label: 'Medium', description: 'Balanced level of detail' },
  { value: 'detailed', label: 'Detailed', description: 'Thorough with examples' },
]

const STT_PROVIDERS: { value: STTProviderType; label: string; description: string; disabled?: boolean }[] = [
  { value: 'openai', label: 'OpenAI Whisper', description: 'High accuracy, $0.006/min' },
  { value: 'groq', label: 'Groq Whisper', description: 'Fast & cheap, $0.04/hr' },
  { value: 'local', label: 'Local (Free, Offline)', description: 'Free, offline, private' },
]

const CLEANUP_PROVIDERS: { value: CleanupProviderType; label: string; description: string }[] = [
  { value: 'openai', label: 'OpenAI GPT-4o-mini', description: 'Best quality cleanup' },
  { value: 'groq', label: 'Groq Llama', description: 'Fast & cheap cleanup' },
]

export function AIProcessingSection() {
  const { settings, updateSetting, saveApiKey, isManagedMode } = useSettings()
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasGroqKey, setHasGroqKey] = useState(false)

  // Custom vocabulary local state
  const [vocabInput, setVocabInput] = useState('')

  // Word replacement local state
  const [replOriginal, setReplOriginal] = useState('')
  const [replReplacement, setReplReplacement] = useState('')

  useEffect(() => {
    async function init() {
      if (window.electronAPI) {
        setHasOpenAIKey(await window.electronAPI.hasApiKey('openai'))
        setHasGroqKey(await window.electronAPI.hasApiKey('groq'))
      }
    }
    init()
  }, [])

  const handleSaveKey = async (key: string, provider: string) => {
    const result = await saveApiKey(key, provider)
    if (result.success) {
      if (provider === 'openai') setHasOpenAIKey(true)
      if (provider === 'groq') setHasGroqKey(true)
    }
    return result
  }

  const handleDeleteKey = async (provider: string) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteApiKey(provider)
    } else {
      localStorage.removeItem(`voxgen-api-key-${provider}`)
    }
    if (provider === 'openai') setHasOpenAIKey(false)
    if (provider === 'groq') setHasGroqKey(false)
    toast({ title: 'API key deleted', description: `${provider} key removed from secure storage`, variant: 'success' })
  }

  // Custom Vocabulary helpers
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

  // Word Replacement helpers
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
        <h2 className="text-lg font-semibold">AI Processing</h2>
        <p className="text-sm text-muted-foreground">Speech recognition, AI cleanup, and enhancement options</p>
      </div>

      {/* Managed Mode Banner */}
      {isManagedMode && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Cloud className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Using VoxGen Cloud</p>
              <p className="text-xs text-muted-foreground">
                Your trial includes managed API access — no API keys needed.
                Add your own keys below to use your preferred provider instead.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 1: Provider Selection & API Keys */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Provider Selection & API Keys</CardTitle>
          <CardDescription>
            {isManagedMode
              ? 'Using Groq Whisper via VoxGen Cloud. Add your own keys to choose a provider.'
              : 'Choose how your voice is transcribed and cleaned up'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Speech Recognition */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Speech Recognition</Label>
            <div className="grid gap-2">
              {STT_PROVIDERS.map((p) => (
                <label
                  key={p.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    settings.sttProvider === p.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  } ${p.disabled || isManagedMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="sttProvider"
                    value={p.value}
                    checked={settings.sttProvider === p.value}
                    onChange={() => { if (!p.disabled && !isManagedMode) updateSetting('sttProvider', p.value) }}
                    disabled={p.disabled || isManagedMode}
                    className="accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {settings.sttProvider === 'local' && (
              <LocalModelManager
                modelSize={settings.localModelSize}
                onModelSizeChange={(s) => updateSetting('localModelSize', s)}
              />
            )}
          </div>

          {/* AI Text Cleanup */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">AI Text Cleanup</Label>
              <Switch
                checked={settings.cleanupEnabled}
                onCheckedChange={(v) => updateSetting('cleanupEnabled', v)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Remove filler words and fix grammar</p>
            {settings.cleanupEnabled && !isManagedMode && (
              <div className="grid gap-2 mt-3">
                {CLEANUP_PROVIDERS.map((p) => (
                  <label
                    key={p.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      settings.cleanupProvider === p.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cleanupProvider"
                      value={p.value}
                      checked={settings.cleanupProvider === p.value}
                      onChange={() => updateSetting('cleanupProvider', p.value)}
                      className="accent-primary"
                    />
                    <div>
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* API Keys */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">API Keys</Label>
            <p className="text-xs text-muted-foreground">
              {isManagedMode
                ? 'Optional — add your own keys to use your preferred provider and bypass VoxGen Cloud'
                : 'Your keys are encrypted on-device'}
            </p>
            <div className="space-y-3">
              <ProviderApiKeyInput
                provider="openai"
                label="OpenAI API Key"
                placeholder="sk-..."
                hasKey={hasOpenAIKey}
                onSave={handleSaveKey}
                onDelete={handleDeleteKey}
              />
              <ProviderApiKeyInput
                provider="groq"
                label="Groq API Key"
                placeholder="gsk_..."
                hasKey={hasGroqKey}
                onSave={handleSaveKey}
                onDelete={handleDeleteKey}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Processing Options */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Processing Options</CardTitle>
          <CardDescription>Advanced settings for content generation and output control</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Code Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Code Mode</Label>
              <p className="text-xs text-muted-foreground">
                Convert spoken words to code syntax instead of natural language
              </p>
            </div>
            <Switch
              checked={settings.codeMode}
              onCheckedChange={(v) => updateSetting('codeMode', v)}
            />
          </div>

          {/* Keyword Triggers */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Keyword Triggers</Label>
              <p className="text-xs text-muted-foreground">
                Auto-detect commands like "write me an email about..." and generate content
              </p>
            </div>
            <Switch
              checked={settings.keywordTriggersEnabled}
              onCheckedChange={(v) => updateSetting('keywordTriggersEnabled', v)}
            />
          </div>

          {/* Output Length */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label>Output Length</Label>
              <p className="text-xs text-muted-foreground">Control the length of AI-generated content</p>
            </div>
            <div className="grid gap-2">
              {OUTPUT_LENGTHS.map((l) => (
                <label
                  key={l.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    settings.outputLength === l.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="outputLength"
                    value={l.value}
                    checked={settings.outputLength === l.value}
                    onChange={() => updateSetting('outputLength', l.value)}
                    className="accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">{l.label}</div>
                    <div className="text-xs text-muted-foreground">{l.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Prompt Refinement */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Prompt Refinement</Label>
              <p className="text-xs text-muted-foreground">
                AI cleans up your spoken instructions before generating content
              </p>
            </div>
            <Switch
              checked={settings.promptRefinementEnabled}
              onCheckedChange={(v) => updateSetting('promptRefinementEnabled', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Context Injection */}
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

      {/* Card 4: Custom Vocabulary */}
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

      {/* Card 5: Word Replacements */}
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
