import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { ProviderApiKeyInput } from '@/components/settings/ProviderApiKeyInput'
import { LanguageSelect } from '@/components/settings/LanguageSelect'
import { ThemeToggle } from '@/components/settings/ThemeToggle'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { LicenseInput } from '@/components/settings/LicenseInput'
import { LocalModelManager } from '@/components/settings/LocalModelManager'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/useToast'
import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType } from '@/lib/cleanup/types'

const STT_PROVIDERS: { value: STTProviderType; label: string; description: string; disabled?: boolean }[] = [
  { value: 'openai', label: 'OpenAI Whisper', description: 'High accuracy, $0.006/min' },
  { value: 'groq', label: 'Groq Whisper', description: 'Fast & cheap, $0.04/hr' },
  { value: 'local', label: 'Local (Free, Offline)', description: 'Free, offline, private' },
]

const CLEANUP_PROVIDERS: { value: CleanupProviderType; label: string; description: string }[] = [
  { value: 'openai', label: 'OpenAI GPT-4o-mini', description: 'Best quality cleanup' },
  { value: 'groq', label: 'Groq Llama', description: 'Fast & cheap cleanup' },
]

export function SettingsPage() {
  const { settings, updateSetting, saveApiKey } = useSettings()
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasGroqKey, setHasGroqKey] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [appVersion, setAppVersion] = useState<string>('')

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

  const handleHoldHotkeyChange = (hotkey: string) => {
    updateSetting('holdHotkey', hotkey)
    toast({ title: 'Hold hotkey updated', description: hotkey ? `Now using ${hotkey}` : 'Disabled', variant: 'success' })
  }

  const handleToggleHotkeyChange = (hotkey: string) => {
    updateSetting('toggleHotkey', hotkey)
    toast({ title: 'Toggle hotkey updated', description: hotkey ? `Now using ${hotkey}` : 'Disabled', variant: 'success' })
  }

  const handlePromptHotkeyChange = (hotkey: string) => {
    updateSetting('promptHotkey', hotkey)
    toast({ title: 'AI Prompt hotkey updated', description: hotkey ? `Now using ${hotkey}` : 'Disabled', variant: 'success' })
  }

  const handleDoubleTapHotkeyChange = (hotkey: string) => {
    updateSetting('doubleTapHotkey', hotkey)
    toast({ title: 'Double-tap hotkey updated', description: hotkey ? `Now using ${hotkey}` : 'Disabled', variant: 'success' })
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
      localStorage.removeItem(`voiceflow-api-key-${provider}`)
    }
    if (provider === 'openai') setHasOpenAIKey(false)
    if (provider === 'groq') setHasGroqKey(false)
    toast({ title: 'API key deleted', description: `${provider} key removed from secure storage`, variant: 'success' })
  }

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI) return
    setCheckingUpdate(true)
    setUpdateStatus(null)
    try {
      const result = await window.electronAPI.checkForUpdates()
      if (result.updateAvailable) {
        if (result.downloaded) {
          setUpdateStatus(`Update v${result.version} ready — restart to install`)
        } else {
          setUpdateStatus(`Update v${result.version} available — downloading...`)
        }
      } else {
        setUpdateStatus('Up to date')
      }
    } catch {
      setUpdateStatus('Failed to check for updates')
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleInstallUpdate = async () => {
    if (!window.electronAPI) return
    await window.electronAPI.installUpdate()
  }

  const needsOpenAI = settings.sttProvider === 'openai' || settings.cleanupProvider === 'openai'
  const needsGroq = settings.sttProvider === 'groq' || settings.cleanupProvider === 'groq'

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>

        {/* License */}
        <LicenseInput />

        <Separator />

        {/* Speech Recognition Provider */}
        <div className="space-y-3">
          <Label>Speech Recognition</Label>
          <p className="text-xs text-muted-foreground">
            Choose how your voice is transcribed to text
          </p>
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
                  onChange={() => {
                    if (!p.disabled) updateSetting('sttProvider', p.value)
                  }}
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
        </div>

        <Separator />

        {/* AI Cleanup Provider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>AI Text Cleanup</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Remove filler words and fix grammar
              </p>
            </div>
            <Switch
              checked={settings.cleanupEnabled}
              onCheckedChange={(v) => updateSetting('cleanupEnabled', v)}
            />
          </div>
          {settings.cleanupEnabled && (
            <div className="grid gap-2 mt-2">
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

        <Separator />

        {/* API Keys — only show what's needed */}
        {(needsOpenAI || needsGroq) && (
          <>
            <div className="space-y-4">
              <Label className="text-base">API Keys</Label>
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
            </div>
            <Separator />
          </>
        )}

        {/* Language */}
        <LanguageSelect
          value={settings.language}
          onChange={(v) => updateSetting('language', v)}
        />

        <Separator />

        {/* Hold-to-Record Hotkey */}
        <HotkeyRecorder
          value={settings.holdHotkey}
          onChange={handleHoldHotkeyChange}
          label="Hold-to-Record Hotkey"
          description="Hold to speak, release to stop. Try Alt+J or Ctrl+Space to avoid conflicts with other apps"
          allowClear
        />

        {/* Toggle Hotkey */}
        <HotkeyRecorder
          value={settings.toggleHotkey}
          onChange={handleToggleHotkeyChange}
          label="Toggle Hotkey"
          description="Press once to start recording, press again to stop and paste"
          allowClear
        />

        {/* AI Prompt Hotkey */}
        <HotkeyRecorder
          value={settings.promptHotkey}
          onChange={handlePromptHotkeyChange}
          label="AI Prompt Hotkey"
          description="Press to start, speak instructions, press again — AI generates full content (emails, docs, etc.)"
          allowClear
        />

        {/* Double-Tap Hotkey */}
        <HotkeyRecorder
          value={settings.doubleTapHotkey}
          onChange={handleDoubleTapHotkeyChange}
          label="Double-Tap Hotkey"
          description="Double-press a modifier key (Alt, Ctrl, Shift, or Windows) to start/stop recording"
          allowClear
        />

        <Separator />

        {/* Code Mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Code Mode</Label>
            <p className="text-xs text-muted-foreground">
              Convert spoken words to code syntax instead of natural language cleanup
            </p>
          </div>
          <Switch
            checked={settings.codeMode}
            onCheckedChange={(v) => updateSetting('codeMode', v)}
          />
        </div>

        <Separator />

        {/* Auto-paste toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto-paste</Label>
            <p className="text-xs text-muted-foreground">
              Automatically paste text into the focused app after transcription
            </p>
          </div>
          <Switch
            checked={settings.autoCopy}
            onCheckedChange={(v) => updateSetting('autoCopy', v)}
          />
        </div>

        <Separator />

        {/* Theme */}
        <ThemeToggle
          theme={settings.theme}
          onChange={(v) => updateSetting('theme', v)}
        />

        <Separator />

        {/* Updates */}
        <div className="space-y-2">
          {appVersion && (
            <p className="text-sm text-muted-foreground">VoiceFlow v{appVersion}</p>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckForUpdates}
              disabled={checkingUpdate}
            >
              {checkingUpdate ? 'Checking...' : 'Check for Updates'}
            </Button>
            {updateStatus?.includes('restart') && (
              <Button size="sm" onClick={handleInstallUpdate}>
                Restart & Update
              </Button>
            )}
          </div>
          {updateStatus && (
            <p className="text-xs text-muted-foreground">{updateStatus}</p>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
