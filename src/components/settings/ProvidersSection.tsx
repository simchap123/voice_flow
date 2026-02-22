import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { ProviderApiKeyInput } from '@/components/settings/ProviderApiKeyInput'
import { LocalModelManager } from '@/components/settings/LocalModelManager'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/useToast'
import { Cloud, Check, Wifi } from 'lucide-react'
import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType, OutputLength } from '@/lib/cleanup/types'

const OUTPUT_LENGTHS: { value: OutputLength; label: string; description: string }[] = [
  { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
  { value: 'medium', label: 'Medium', description: 'Balanced level of detail' },
  { value: 'detailed', label: 'Detailed', description: 'Thorough with examples' },
]

const STT_PROVIDERS: { value: STTProviderType; label: string; description: string; keyPrefix?: string; keyPlaceholder?: string }[] = [
  { value: 'openai', label: 'OpenAI Whisper', description: 'High accuracy, $0.006/min', keyPrefix: 'sk-', keyPlaceholder: 'sk-...' },
  { value: 'groq', label: 'Groq Whisper', description: 'Fast & cheap, $0.04/hr', keyPrefix: 'gsk_', keyPlaceholder: 'gsk_...' },
  { value: 'local', label: 'Local (Free, Offline)', description: 'Free, offline, private — no API key needed' },
]

const CLEANUP_PROVIDERS: { value: CleanupProviderType; label: string; description: string; keyPrefix?: string; keyPlaceholder?: string }[] = [
  { value: 'openai', label: 'OpenAI GPT-4o-mini', description: 'Best quality cleanup', keyPrefix: 'sk-', keyPlaceholder: 'sk-...' },
  { value: 'groq', label: 'Groq Llama', description: 'Fast & cheap cleanup', keyPrefix: 'gsk_', keyPlaceholder: 'gsk_...' },
]

export function ProvidersSection() {
  const { settings, updateSetting, saveApiKey, isManagedMode } = useSettings()
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

  const hasKeyFor = (provider: string) => {
    if (provider === 'openai') return hasOpenAIKey
    if (provider === 'groq') return hasGroqKey
    return false
  }

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

  const isCloudProvider = (v: string) => v === 'openai' || v === 'groq'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Providers</h2>
        <p className="text-sm text-muted-foreground">Speech recognition, AI cleanup, and API keys</p>
      </div>

      {/* Managed Mode Banner */}
      {isManagedMode && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Cloud className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Using VoxGen Cloud</p>
              <p className="text-xs text-muted-foreground">
                Your plan includes managed API access — no API keys needed.
                You can still add your own keys below to use a specific provider.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speech Recognition */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Speech Recognition</CardTitle>
          <CardDescription>
            {isManagedMode
              ? 'Using Groq Whisper via VoxGen Cloud. Select a provider and add your own key to switch.'
              : 'Choose how your voice is transcribed to text'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {STT_PROVIDERS.map((p) => {
              const isSelected = settings.sttProvider === p.value
              const isCloud = isCloudProvider(p.value)
              const hasKey = hasKeyFor(p.value)
              // Show inline key input when: selected + cloud + no key yet + not managed
              // Also show when: selected + cloud + has key (for replace/delete)
              const showInlineKey = isSelected && isCloud && !isManagedMode

              return (
                <div key={p.value}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    } ${showInlineKey ? 'rounded-b-none border-b-0' : ''}`}
                  >
                    <input
                      type="radio"
                      name="sttProvider"
                      value={p.value}
                      checked={isSelected}
                      onChange={() => updateSetting('sttProvider', p.value)}
                      className="accent-primary"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                    {isCloud && hasKey && (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <Check className="h-3 w-3" />
                        Key set
                      </span>
                    )}
                    {isSelected && isCloud && isManagedMode && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Wifi className="h-3 w-3" />
                        Cloud
                      </span>
                    )}
                  </label>
                  {/* Inline API key input — expands directly under the selected cloud provider */}
                  {showInlineKey && (
                    <div className="rounded-b-lg border border-primary bg-primary/[0.02] p-3 animate-in slide-in-from-top-1 duration-200">
                      <ProviderApiKeyInput
                        provider={p.value}
                        label={`${p.label.split(' ')[0]} API Key`}
                        placeholder={p.keyPlaceholder ?? ''}
                        hasKey={hasKey}
                        onSave={handleSaveKey}
                        onDelete={handleDeleteKey}
                      />
                    </div>
                  )}
                  {/* Managed mode note — shown when managed user selects a cloud provider */}
                  {isSelected && isCloud && isManagedMode && (
                    <div className="rounded-b-lg border border-primary/30 bg-primary/[0.03] px-3 py-2 text-xs text-muted-foreground -mt-px">
                      <Wifi className="inline h-3 w-3 mr-1 text-primary" />
                      Using VoxGen Cloud — no API key needed. Add your own key to override:
                      <button
                        onClick={() => {/* Expand key input by switching off managed for display */}}
                        className="ml-1 text-primary hover:underline font-medium"
                      >
                        Enter key
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
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
              {CLEANUP_PROVIDERS.map((p) => {
                const isSelected = settings.cleanupProvider === p.value
                const hasKey = hasKeyFor(p.value)
                const showInlineKey = isSelected && !isManagedMode

                return (
                  <div key={p.value}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      } ${showInlineKey ? 'rounded-b-none border-b-0' : ''}`}
                    >
                      <input
                        type="radio"
                        name="cleanupProvider"
                        value={p.value}
                        checked={isSelected}
                        onChange={() => updateSetting('cleanupProvider', p.value)}
                        className="accent-primary"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{p.label}</div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                      </div>
                      {hasKey && (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <Check className="h-3 w-3" />
                          Key set
                        </span>
                      )}
                    </label>
                    {showInlineKey && (
                      <div className="rounded-b-lg border border-primary bg-primary/[0.02] p-3 animate-in slide-in-from-top-1 duration-200">
                        <ProviderApiKeyInput
                          provider={p.value}
                          label={`${p.label.split(' ')[0]} API Key`}
                          placeholder={p.keyPlaceholder ?? ''}
                          hasKey={hasKey}
                          onSave={handleSaveKey}
                          onDelete={handleDeleteKey}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

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
