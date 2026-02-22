import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/useSettings'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { ProviderApiKeyInput } from '@/components/settings/ProviderApiKeyInput'
import { LicenseInput } from '@/components/settings/LicenseInput'
import { Switch } from '@/components/ui/switch'
import { Mic, Zap, User, Sparkles, Bell, Key, X, RefreshCw, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/useToast'
import type { STTProviderType } from '@/lib/stt/types'

type Tab = 'general' | 'notifications' | 'account'

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'account', label: 'Account' },
]

const STT_OPTIONS: { value: STTProviderType; label: string; disabled?: boolean }[] = [
  { value: 'groq', label: 'Groq' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'local', label: 'Local', disabled: true },
]

export function SettingsPage() {
  const { settings, updateSetting, saveApiKey, isManagedMode } = useSettings()
  const [tab, setTab] = useState<Tab>('general')
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasGroqKey, setHasGroqKey] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloaded' | 'uptodate'>('idle')
  const [updateVersion, setUpdateVersion] = useState('')
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

  const handleCheckUpdate = async () => {
    if (!window.electronAPI) return
    setUpdateStatus('checking')
    try {
      const result = await window.electronAPI.checkForUpdates()
      if (result.updateAvailable) {
        setUpdateVersion(result.version || '')
        setUpdateStatus(result.downloaded ? 'downloaded' : 'available')
      } else {
        setUpdateStatus('uptodate')
        setTimeout(() => setUpdateStatus('idle'), 3000)
      }
    } catch {
      setUpdateStatus('idle')
      toast({ title: 'Failed to check for updates', variant: 'error' })
    }
  }

  const handleInstallUpdate = async () => {
    if (!window.electronAPI) return
    await window.electronAPI.installUpdate()
  }

  const currentSTT = settings.sttProvider || 'groq'
  const currentKeyExists = currentSTT === 'openai' ? hasOpenAIKey : currentSTT === 'groq' ? hasGroqKey : false

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
                          if (opt.disabled) return
                          updateSetting('sttProvider', opt.value)
                          toast({ title: `Switched to ${opt.label}`, variant: 'success' })
                        }}
                        title={opt.disabled ? 'Coming soon' : undefined}
                        className={`flex-1 rounded-[5px] px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                          opt.disabled
                            ? 'text-muted-foreground/30 cursor-not-allowed'
                            : currentSTT === opt.value
                              ? 'bg-card shadow-sm text-foreground border border-border/40 cursor-pointer'
                              : 'text-muted-foreground/60 hover:text-foreground border border-transparent cursor-pointer'
                        }`}
                      >
                        {opt.label}{opt.disabled ? ' (soon)' : ''}
                      </button>
                    ))}
                  </div>
                  {isManagedMode && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground/40">Using VoxGen Cloud — add your own key below to use a preferred provider</p>
                  )}
                </div>
              </div>

              {/* API Key — compact row with popup */}
              {currentSTT !== 'local' && !isManagedMode && (
                <div className="flex items-center gap-5 mt-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">API Key</div>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    {currentKeyExists ? (
                      <>
                        <span className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
                          <Check className="w-3 h-3" />
                          Key configured
                        </span>
                        <button
                          onClick={() => setShowKeyDialog(true)}
                          className="text-[11px] text-muted-foreground/50 hover:text-primary transition-colors underline"
                        >
                          Change
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowKeyDialog(true)}
                        className="flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                      >
                        <Key className="w-3 h-3" />
                        Add API key
                      </button>
                    )}
                  </div>
                </div>
              )}
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
              <div className="space-y-0">
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Auto-update</div>
                    <div className="text-[10px] text-muted-foreground/40">Download & install automatically</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">Enabled</span>
                    <Switch checked disabled />
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Version</div>
                    <div className="text-[10px] text-muted-foreground/40">v{appVersion || '—'}</div>
                  </div>
                  <div className="flex-1">
                    {updateStatus === 'downloaded' ? (
                      <button
                        onClick={handleInstallUpdate}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-primary/90 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Install v{updateVersion} & restart
                      </button>
                    ) : updateStatus === 'available' ? (
                      <span className="text-[11px] text-primary font-medium">v{updateVersion} downloading...</span>
                    ) : updateStatus === 'uptodate' ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
                        <Check className="w-3 h-3" />
                        Up to date
                      </div>
                    ) : (
                      <button
                        onClick={handleCheckUpdate}
                        disabled={updateStatus === 'checking'}
                        className="flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                        {updateStatus === 'checking' ? 'Checking...' : 'Check for updates'}
                      </button>
                    )}
                  </div>
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

          </div>
        )}
      </div>

      {/* API Key Dialog */}
      {showKeyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowKeyDialog(false)} />
          <div className="relative bg-card border border-border rounded-xl shadow-xl p-5 w-[380px] max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <span className="text-[14px] font-semibold">
                  {currentSTT === 'openai' ? 'OpenAI' : 'Groq'} API Key
                </span>
              </div>
              <button
                onClick={() => setShowKeyDialog(false)}
                className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <ProviderApiKeyInput
              provider={currentSTT}
              label={currentSTT === 'openai' ? 'OpenAI' : 'Groq'}
              placeholder={currentSTT === 'openai' ? 'sk-...' : 'gsk_...'}
              hasKey={currentSTT === 'openai' ? hasOpenAIKey : hasGroqKey}
              onSave={async (key, provider) => {
                const result = await handleSaveKey(key, provider)
                if (result.success) {
                  setTimeout(() => setShowKeyDialog(false), 1000)
                }
                return result
              }}
              onDelete={async (provider) => {
                await handleDeleteKey(provider)
                setTimeout(() => setShowKeyDialog(false), 1000)
              }}
            />
          </div>
        </div>
      )}
    </ScrollArea>
  )
}
