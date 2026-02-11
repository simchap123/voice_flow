import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { ProviderApiKeyInput } from '@/components/settings/ProviderApiKeyInput'
import { LocalModelManager } from '@/components/settings/LocalModelManager'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/useToast'
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

export function ProvidersSection() {
  const { settings, updateSetting, saveApiKey } = useSettings()
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasGroqKey, setHasGroqKey] = useState(false)

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

  const needsOpenAI = settings.sttProvider === 'openai' || settings.cleanupProvider === 'openai'
  const needsGroq = settings.sttProvider === 'groq' || settings.cleanupProvider === 'groq'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Providers</h2>
        <p className="text-sm text-muted-foreground">Speech recognition, AI cleanup, and API keys</p>
      </div>

      {/* Speech Recognition */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Speech Recognition</CardTitle>
          <CardDescription>Choose how your voice is transcribed to text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {STT_PROVIDERS.map((p) => (
              <label
                key={p.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  settings.sttProvider === p.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                } ${p.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="sttProvider"
                  value={p.value}
                  checked={settings.sttProvider === p.value}
                  onChange={() => { if (!p.disabled) updateSetting('sttProvider', p.value) }}
                  disabled={p.disabled}
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
        </CardContent>
      </Card>

      {/* AI Text Cleanup */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">AI Text Cleanup</CardTitle>
              <CardDescription className="mt-1">Remove filler words and fix grammar</CardDescription>
            </div>
            <Switch
              checked={settings.cleanupEnabled}
              onCheckedChange={(v) => updateSetting('cleanupEnabled', v)}
            />
          </div>
        </CardHeader>
        {settings.cleanupEnabled && (
          <CardContent>
            <div className="grid gap-2">
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
          </CardContent>
        )}
      </Card>

      {/* API Keys */}
      {(needsOpenAI || needsGroq) && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">API Keys</CardTitle>
            <CardDescription>Your keys are encrypted on-device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsOpenAI && (
              <ProviderApiKeyInput
                provider="openai"
                label="OpenAI API Key"
                placeholder="sk-..."
                hasKey={hasOpenAIKey}
                onSave={handleSaveKey}
                onDelete={handleDeleteKey}
              />
            )}
            {needsGroq && (
              <ProviderApiKeyInput
                provider="groq"
                label="Groq API Key"
                placeholder="gsk_..."
                hasKey={hasGroqKey}
                onSave={handleSaveKey}
                onDelete={handleDeleteKey}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Advanced */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Advanced</CardTitle>
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
    </div>
  )
}
