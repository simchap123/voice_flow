import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/useSettings'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { ProviderApiKeyInput } from '@/components/settings/ProviderApiKeyInput'
import { LicenseInput } from '@/components/settings/LicenseInput'
import { Switch } from '@/components/ui/switch'
import { Mic, Zap, Sliders, User, Key, Sparkles, Volume2, Bell } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import type { STTProviderType } from '@/lib/stt/types'

type Tab = 'general' | 'notifications' | 'account'

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'account', label: 'Account' },
]

const STT_OPTIONS: { value: STTProviderType; label: string }[] = [
  { value: 'groq', label: 'Groq' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'local', label: 'Local' },
]

export function SettingsPage() {
  const { settings, updateSetting, saveApiKey, isManagedMode } = useSettings()
  const [tab, setTab] = useState<Tab>('general')
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

  const currentSTT = settings.sttProvider || 'groq'

  return (
    <ScrollArea className="h-full">
      <div className="page-enter p-6 max-w-[560px]">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-[16px] font-bold tracking-tight">Settings</h2>
          <p className="text-[11px] text-muted-foreground/50">General application preferences</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0 mb-2 border-b border-border/30">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-[13px] font-semibold transition-all relative -mb-px ${
                tab === t.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground/40 hover:text-muted-foreground border-b-2 border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ──── General Tab ──── */}
        {tab === 'general' && (
          <div className="settings-tab-enter">
            {/* Recording */}
            <div className="settings-section-enter py-5 border-b border-border/20" style={{ animationDelay: '0s' }}>
              <div className="mb-4">
                <div className="text-[14px] font-semibold">Recording</div>
                <div className="text-[12px] text-muted-foreground/50">Hotkeys and trigger methods</div>
              </div>
              <div className="space-y-0">
                <div className="flex items-start gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground flex items-center gap-2">
                      <Mic className="w-4 h-4 text-muted-foreground/50" />
                      Hold to record
                    </div>
                  </div>
                  <div className="flex-1">
                    <HotkeyRecorder
                      value={settings.holdHotkey}
                      onChange={(v) => {
                        updateSetting('holdHotkey', v)
                        toast({ title: 'Hold hotkey updated', variant: 'success' })
                      }}
                      placeholder="Set hotkey"
                      allowClear
                    />
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-start gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-muted-foreground/50" />
                      AI Prompt
                    </div>
                  </div>
                  <div className="flex-1">
                    <HotkeyRecorder
                      value={settings.promptHotkey}
                      onChange={(v) => {
                        updateSetting('promptHotkey', v)
                        toast({ title: 'AI Prompt hotkey updated', variant: 'success' })
                      }}
                      placeholder="Set hotkey"
                      allowClear
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STT Provider */}
            <div className="settings-section-enter py-5 border-b border-border/20" style={{ animationDelay: '0.06s' }}>
              <div className="mb-4">
                <div className="text-[14px] font-semibold">STT Provider</div>
                <div className="text-[12px] text-muted-foreground/50">Speech-to-text engine</div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-[160px] shrink-0">
                  <div className="text-[13px] font-medium text-muted-foreground">Engine</div>
                </div>
                <div className="flex-1">
                  <div className="flex rounded-md border border-border/40 bg-muted/20 p-0.5">
                    {STT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          updateSetting('sttProvider', opt.value)
                          toast({ title: `Switched to ${opt.label}`, variant: 'success' })
                        }}
                        className={`flex-1 rounded-[5px] px-3 py-1.5 text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                          currentSTT === opt.value
                            ? 'bg-card shadow-sm text-foreground border border-border/40'
                            : 'text-muted-foreground/60 hover:text-foreground border border-transparent'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {currentSTT === 'local' && (
                    <p className="mt-1.5 text-[10px] text-primary font-medium">Free forever — no API key or license needed</p>
                  )}
                  {isManagedMode && currentSTT !== 'local' && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground/40">Using VoxGen Cloud — add your own key in Account, or switch to Local (free)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="settings-section-enter py-5" style={{ animationDelay: '0.12s' }}>
              <div className="mb-4">
                <div className="text-[14px] font-semibold">Preferences</div>
                <div className="text-[12px] text-muted-foreground/50">Behavior settings</div>
              </div>
              <div className="space-y-0">
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Auto-paste</div>
                    <div className="text-[10px] text-muted-foreground/40">Type into focused app</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">{(settings.autoCopy ?? true) ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={settings.autoCopy ?? true}
                      onCheckedChange={(v) => updateSetting('autoCopy', v)}
                    />
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">AI Cleanup</div>
                    <div className="text-[10px] text-muted-foreground/40">Fix grammar & filler words</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">{settings.cleanupEnabled ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={settings.cleanupEnabled}
                      onCheckedChange={(v) => updateSetting('cleanupEnabled', v)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──── Notifications Tab ──── */}
        {tab === 'notifications' && (
          <div className="settings-tab-enter">
            <div className="settings-section-enter py-5" style={{ animationDelay: '0s' }}>
              <div className="mb-4">
                <div className="text-[14px] font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Sound & Alerts
                </div>
                <div className="text-[12px] text-muted-foreground/50">Audio feedback and desktop notifications</div>
              </div>
              <div className="space-y-0">
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Sound effects</div>
                    <div className="text-[10px] text-muted-foreground/40">Play sound on record start/stop</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">{(settings.soundEnabled ?? true) ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={settings.soundEnabled ?? true}
                      onCheckedChange={(v) => updateSetting('soundEnabled', v)}
                    />
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Error alerts</div>
                    <div className="text-[10px] text-muted-foreground/40">Show notification on failures</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">{(settings.errorNotifications ?? true) ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={settings.errorNotifications ?? true}
                      onCheckedChange={(v) => updateSetting('errorNotifications', v)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Updates */}
            <div className="settings-section-enter py-5 border-t border-border/20" style={{ animationDelay: '0.06s' }}>
              <div className="mb-4">
                <div className="text-[14px] font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Updates
                </div>
                <div className="text-[12px] text-muted-foreground/50">Keep VoxGen up to date</div>
              </div>
              <div className="flex items-center gap-5 py-3">
                <div className="w-[160px] shrink-0">
                  <div className="text-[13px] font-medium text-muted-foreground">Auto-update</div>
                  <div className="text-[10px] text-muted-foreground/40">Download & install automatically</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">Enabled</span>
                    <Switch checked disabled />
                  </div>
                  {appVersion && (
                    <div className="mt-2 flex items-center gap-2 rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
                      <Volume2 className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] text-primary font-medium">You're up to date — v{appVersion}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──── Account Tab ──── */}
        {tab === 'account' && (
          <div className="settings-tab-enter">
            {/* License */}
            <div className="settings-section-enter py-5 border-b border-border/20" style={{ animationDelay: '0s' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[14px] font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    License
                  </div>
                  <div className="text-[12px] text-muted-foreground/50">Manage your subscription</div>
                </div>
                <button
                  onClick={() => window.electronAPI?.openExternal('https://voxgenflow.vercel.app/whats-new.html')}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 hover:text-primary transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  What's New
                </button>
              </div>
              <LicenseInput />
            </div>

            {/* API Keys */}
            <div className="settings-section-enter py-5 border-b border-border/20" style={{ animationDelay: '0.06s' }}>
              <div className="mb-4">
                <div className="text-[14px] font-semibold flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  API Keys
                </div>
                <div className="text-[12px] text-muted-foreground/50">
                  {isManagedMode
                    ? 'Optional — add your own keys to use a preferred provider'
                    : 'Required for transcription — encrypted on-device'}
                </div>
              </div>
              <div className="space-y-3">
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
            </div>

            {/* App Info */}
            <div className="settings-section-enter py-5" style={{ animationDelay: '0.12s' }}>
              <div className="mb-4">
                <div className="text-[14px] font-semibold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  App
                </div>
              </div>
              <div className="space-y-0">
                <div className="flex items-center gap-5 py-2.5">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Version</div>
                  </div>
                  <div className="flex-1">
                    <span className="text-[13px] font-medium">{appVersion || '—'}</span>
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-2.5">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Local model</div>
                  </div>
                  <div className="flex-1">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      Free forever
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
