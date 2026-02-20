import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/useSettings'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { ProviderApiKeyInput } from '@/components/settings/ProviderApiKeyInput'
import { LicenseInput } from '@/components/settings/LicenseInput'
import { Switch } from '@/components/ui/switch'
import { Mic, Zap, Settings as SettingsIcon, User, Sparkles } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import type { STTProviderType } from '@/lib/stt/types'

const STT_OPTIONS: { value: STTProviderType; label: string }[] = [
  { value: 'groq', label: 'Groq' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'local', label: 'Local' },
]

export function SettingsPage() {
  const { settings, updateSetting, saveApiKey, isManagedMode } = useSettings()
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasGroqKey, setHasGroqKey] = useState(false)
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    async function init() {
      if (window.electronAPI) {
        setHasOpenAIKey(await window.electronAPI.hasApiKey('openai'))
        setHasGroqKey(await window.electronAPI.hasApiKey('groq'))
        setAppVersion(await window.electronAPI.getAppVersion())
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
    toast({ title: 'API key deleted', variant: 'success' })
  }

  const currentSTT = isManagedMode ? 'groq' : settings.sttProvider

  return (
    <ScrollArea className="h-full">
      <div className="page-enter p-6 space-y-3 max-w-[560px]">
        <div className="mb-2">
          <h2 className="text-[16px] font-bold tracking-tight">Settings</h2>
          <p className="text-[11px] text-muted-foreground/50">Recording, providers, and preferences</p>
        </div>

        {/* Card 1: Recording */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
              <Mic className="h-[14px] w-[14px] text-muted-foreground" />
            </div>
            <div>
              <div className="text-[13px] font-semibold">Recording</div>
              <div className="text-[10px] text-muted-foreground/50">Hotkeys and trigger methods</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HotkeyRecorder
                value={settings.holdHotkey}
                onChange={(v) => {
                  updateSetting('holdHotkey', v)
                  toast({ title: 'Hold hotkey updated', variant: 'success' })
                }}
                placeholder="Set hotkey"
                allowClear
              />
              <span className="text-[10px] text-muted-foreground/50">Hold to record</span>
            </div>
            <div className="flex items-center gap-2">
              <HotkeyRecorder
                value={settings.promptHotkey}
                onChange={(v) => {
                  updateSetting('promptHotkey', v)
                  toast({ title: 'AI Prompt hotkey updated', variant: 'success' })
                }}
                placeholder="Set hotkey"
                allowClear
              />
              <span className="text-[10px] text-muted-foreground/50">
                {settings.promptTriggerMethod === 'double-tap' ? 'Double-tap for AI Prompt' : 'AI Prompt'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: STT Provider — Segmented Control */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
              <Zap className="h-[14px] w-[14px] text-muted-foreground" />
            </div>
            <div>
              <div className="text-[13px] font-semibold">STT Provider</div>
              <div className="text-[10px] text-muted-foreground/50">Speech-to-text engine</div>
            </div>
          </div>
          <div className="flex rounded-md border border-border/40 bg-muted/20 p-0.5">
            {STT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  if (!isManagedMode) {
                    updateSetting('sttProvider', opt.value)
                    toast({ title: `Switched to ${opt.label}`, variant: 'success' })
                  }
                }}
                disabled={isManagedMode}
                className={`flex-1 rounded-[5px] px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                  currentSTT === opt.value
                    ? 'bg-card shadow-sm text-foreground border border-border/40'
                    : 'text-muted-foreground/60 hover:text-foreground border border-transparent'
                } ${isManagedMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {isManagedMode && (
            <p className="mt-2 text-[10px] text-muted-foreground/40">Using VoxGen Cloud — add your own API key below to choose a provider</p>
          )}
        </div>

        {/* Card 3: Preferences */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
              <SettingsIcon className="h-[14px] w-[14px] text-muted-foreground" />
            </div>
            <div>
              <div className="text-[13px] font-semibold">Preferences</div>
              <div className="text-[10px] text-muted-foreground/50">Behavior settings</div>
            </div>
          </div>
          <div className="space-y-0">
            <div className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-[12px] font-medium">Auto-paste</div>
                <div className="text-[10px] text-muted-foreground/50">Type text into focused app after transcription</div>
              </div>
              <Switch
                checked={settings.autoCopy ?? true}
                onCheckedChange={(v) => updateSetting('autoCopy', v)}
              />
            </div>
            <div className="border-t border-border/20" />
            <div className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-[12px] font-medium">AI Cleanup</div>
                <div className="text-[10px] text-muted-foreground/50">Fix grammar and remove filler words</div>
              </div>
              <Switch
                checked={settings.cleanupEnabled}
                onCheckedChange={(v) => updateSetting('cleanupEnabled', v)}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Account */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
                <User className="h-[14px] w-[14px] text-muted-foreground" />
              </div>
              <div>
                <div className="text-[13px] font-semibold">Account</div>
                <div className="text-[10px] text-muted-foreground/50">License, API keys, and app info</div>
              </div>
            </div>
            <button
              onClick={() => window.electronAPI?.openExternal('https://voxgenflow.vercel.app/whats-new.html')}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              What's New
            </button>
          </div>

          {/* License */}
          <div className="mb-4">
            <LicenseInput />
          </div>

          {/* API Keys */}
          <div className="border-t border-border/20 pt-3 space-y-3">
            <div>
              <div className="text-[12px] font-medium">API Keys</div>
              <div className="text-[10px] text-muted-foreground/50">
                {isManagedMode
                  ? 'Optional — add your own keys to use a preferred provider'
                  : 'Required for transcription — keys are encrypted on-device'}
              </div>
            </div>
            <ProviderApiKeyInput
              provider="openai"
              label="OpenAI"
              placeholder="sk-..."
              hasKey={hasOpenAIKey}
              onSave={handleSaveKey}
              onDelete={handleDeleteKey}
            />
            <ProviderApiKeyInput
              provider="groq"
              label="Groq"
              placeholder="gsk_..."
              hasKey={hasGroqKey}
              onSave={handleSaveKey}
              onDelete={handleDeleteKey}
            />
          </div>

          {/* Version */}
          {appVersion && (
            <div className="border-t border-border/20 pt-3 mt-3">
              <div className="text-[10px] text-muted-foreground/40">VoxGen v{appVersion}</div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
