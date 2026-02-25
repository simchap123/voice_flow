import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/useSettings'
import { HotkeyRow } from '@/components/settings/hotkey-row'
import { MicrophoneSelect } from '@/components/settings/MicrophoneSelect'
import { LanguageSelect } from '@/components/settings/LanguageSelect'
import { ProviderApiKeyInput } from '@/components/settings/ProviderApiKeyInput'
import { LicenseInput } from '@/components/settings/LicenseInput'
import { Switch } from '@/components/ui/switch'
import { Mic, Zap, User, Sparkles, Bell, Key, X, RefreshCw, Check, Download, Bug, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/useToast'
import type { STTProviderType } from '@/lib/stt/types'
import type { OutputLength } from '@/lib/cleanup/types'
import { useModelDownload } from '@/hooks/useModelDownload'

const ADMIN_EMAIL = 'spentelnik@gmail.com'

const OUTPUT_LENGTHS: { value: OutputLength; label: string; description: string }[] = [
  { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
  { value: 'medium', label: 'Medium', description: 'Balanced level of detail' },
  { value: 'detailed', label: 'Detailed', description: 'Thorough with examples' },
]

// ── DEV TOOLS — Only visible to admin ──
function DevTools() {
  const { settings, updateSetting } = useSettings()
  const [trialDaysLeft, setTrialDaysLeft] = useState(30)
  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    loadTrialState()
  }, [])

  async function loadTrialState() {
    if (!window.electronAPI) return
    const info = await window.electronAPI.getLicenseInfo()
    setDeviceId(info.userEmail?.includes('@device.voxgen.app') ? info.userEmail : '')
    if (info.trialStartedAt) {
      const elapsed = Date.now() - info.trialStartedAt
      const daysUsed = elapsed / (1000 * 60 * 60 * 24)
      setTrialDaysLeft(Math.max(0, Math.floor(30 - daysUsed)))
    }
  }

  async function skipDays(days: number) {
    if (!window.electronAPI) return
    const info = await window.electronAPI.getLicenseInfo()
    const currentStart = info.trialStartedAt || Date.now()
    const newStart = currentStart - (days * 24 * 60 * 60 * 1000)
    updateSetting('trialStartedAt', newStart)
    const elapsed = Date.now() - newStart
    const daysUsed = elapsed / (1000 * 60 * 60 * 24)
    const left = Math.max(0, Math.floor(30 - daysUsed))
    setTrialDaysLeft(left)
    toast({ title: `Skipped ${days} day${days > 1 ? 's' : ''}`, description: `Trial: ${left} days left`, variant: 'success' })
  }

  async function resetTrial() {
    updateSetting('trialStartedAt', Date.now())
    updateSetting('licenseStatus', 'active' as any)
    updateSetting('licensePlan', 'Trial' as any)
    setTrialDaysLeft(30)
    toast({ title: 'Trial reset to 30 days', variant: 'success' })
  }

  async function clearAllHistory() {
    if (!window.electronAPI) return
    await window.electronAPI.setHistory([])
    toast({ title: 'History cleared', variant: 'success' })
  }

  async function clearAllData() {
    if (!window.electronAPI) return
    await window.electronAPI.clearLicense()
    await window.electronAPI.setHistory([])
    updateSetting('trialStartedAt', 0)
    updateSetting('onboardingComplete', false)
    updateSetting('sessionCount', 0 as any)
    toast({ title: 'All local data cleared', description: 'Restart the app for a fresh start', variant: 'success' })
  }

  return (
    <div className="settings-section-enter py-5 border-t border-red-500/20" style={{ animationDelay: '0.06s' }}>
      <div className="mb-4">
        <div className="text-[14px] font-semibold flex items-center gap-2 text-red-400">
          <Bug className="w-4 h-4" />
          Developer Tools
        </div>
        <div className="text-[12px] text-red-400/50">Admin only — {ADMIN_EMAIL}</div>
      </div>

      {/* Trial Time Travel */}
      <div className="rounded-lg border border-border/30 bg-muted/20 p-3 mb-3">
        <div className="text-[12px] font-medium text-muted-foreground mb-2">Trial Time Travel</div>
        <div className="text-[11px] text-muted-foreground/60 mb-2">
          Current: <span className="font-mono font-medium text-foreground">{trialDaysLeft}</span> days left
          {deviceId && <span className="ml-2 text-muted-foreground/40">({deviceId})</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2" onClick={() => skipDays(1)}>
            +1 day
          </Button>
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2" onClick={() => skipDays(5)}>
            +5 days
          </Button>
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2" onClick={() => skipDays(10)}>
            +10 days
          </Button>
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2" onClick={() => skipDays(23)}>
            →7 left
          </Button>
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2" onClick={() => skipDays(27)}>
            →3 left
          </Button>
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2" onClick={() => skipDays(29)}>
            →1 left
          </Button>
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2 text-red-400 border-red-500/30" onClick={() => skipDays(31)}>
            Expire
          </Button>
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2 text-green-400 border-green-500/30" onClick={resetTrial}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-2">
          Adjusts local trialStartedAt. Server-side trial is unchanged — recording will still work until server trial expires.
        </p>
      </div>

      {/* Data Management */}
      <div className="rounded-lg border border-border/30 bg-muted/20 p-3">
        <div className="text-[12px] font-medium text-muted-foreground mb-2">Data Management</div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2" onClick={clearAllHistory}>
            <Trash2 className="w-3 h-3 mr-1" />
            Clear History
          </Button>
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2 text-red-400 border-red-500/30" onClick={clearAllData}>
            <Trash2 className="w-3 h-3 mr-1" />
            Wipe All Local Data
          </Button>
        </div>
      </div>
    </div>
  )
}

type Tab = 'general' | 'notifications' | 'account'

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'account', label: 'Account' },
]

const STT_OPTIONS_BASE: { value: STTProviderType; label: string }[] = [
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
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [keyDialogProvider, setKeyDialogProvider] = useState<STTProviderType | null>(null)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloaded' | 'uptodate'>('idle')
  const [updateVersion, setUpdateVersion] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function init() {
      if (window.electronAPI) {
        setHasOpenAIKey(await window.electronAPI.hasApiKey('openai'))
        setHasGroqKey(await window.electronAPI.hasApiKey('groq'))
        setAppVersion(await window.electronAPI.getAppVersion())
        const licenseInfo = await window.electronAPI.getLicenseInfo()
        setUserEmail(licenseInfo?.userEmail || '')
      }
    }
    init()

    // Listen for email changes so DevTools gate updates in real-time
    const cleanup = window.electronAPI?.onSettingChanged?.((key: string, value: any) => {
      if (key === 'userEmail') setUserEmail(value || '')
    })
    return () => { cleanup?.() }
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

  // OpenAI requires own key — disable if no key
  const STT_OPTIONS = STT_OPTIONS_BASE.map(opt => ({
    ...opt,
    disabled: opt.value === 'openai' && !hasOpenAIKey,
  }))
  const { isDownloading: modelDownloading, progress: modelProgress, isReady: modelReady, startDownload } = useModelDownload(currentSTT)

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
                <div className="text-[12px] text-muted-foreground/50">Configure hotkeys and trigger methods</div>
              </div>
              <div className="space-y-0">
                <HotkeyRow
                  label="Hold (Dictation)"
                  hotkeyKey="holdHotkey"
                  icon={Mic}
                />
                <div className="border-t border-border/10" />
                <HotkeyRow
                  label="Toggle (Dictation)"
                  hotkeyKey="toggleHotkey"
                  triggerMethodKey="toggleTriggerMethod"
                  icon={Mic}
                />
                <div className="border-t border-border/10" />
                <HotkeyRow
                  label="AI Prompt"
                  hotkeyKey="promptHotkey"
                  triggerMethodKey="promptTriggerMethod"
                  icon={Zap}
                />
              </div>
            </div>

            {/* Audio Input */}
            <div className="settings-section-enter py-5 border-b border-border/20" style={{ animationDelay: '0.06s' }}>
              <div className="mb-4">
                <div className="text-[14px] font-semibold">Audio Input</div>
                <div className="text-[12px] text-muted-foreground/50">Microphone and language for all recording modes</div>
              </div>
              <div className="space-y-3">
                <MicrophoneSelect
                  value={settings.audioInputDeviceId}
                  onChange={(v) => updateSetting('audioInputDeviceId', v)}
                />
                <LanguageSelect
                  value={settings.language}
                  onChange={(v) => updateSetting('language', v)}
                />
              </div>
            </div>

            {/* STT Provider */}
            <div className="settings-section-enter py-5 border-b border-border/20" style={{ animationDelay: '0.12s' }}>
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
                          if (opt.disabled) {
                            // Open key dialog for the disabled provider so user can add a key
                            setKeyDialogProvider(opt.value)
                            setShowKeyDialog(true)
                            return
                          }
                          updateSetting('sttProvider', opt.value)
                          toast({ title: `Switched to ${opt.label}`, variant: 'success' })
                        }}
                        title={opt.disabled ? 'Add API key to enable' : undefined}
                        className={`flex-1 rounded-[5px] px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                          opt.disabled
                            ? 'text-muted-foreground/30 cursor-pointer hover:text-muted-foreground/50'
                            : currentSTT === opt.value
                              ? 'bg-card shadow-sm text-foreground border border-border/40 cursor-pointer'
                              : 'text-muted-foreground/60 hover:text-foreground border border-transparent cursor-pointer'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {isManagedMode && currentSTT === 'groq' && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground/40">Using VoxGen Cloud — add your own Groq key below to use your own account</p>
                  )}
                </div>
              </div>

              {/* API Key — compact row with popup */}
              {currentSTT !== 'local' && (
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
                          onClick={() => { setKeyDialogProvider(currentSTT); setShowKeyDialog(true) }}
                          className="text-[11px] text-muted-foreground/50 hover:text-primary transition-colors underline"
                        >
                          Change
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setKeyDialogProvider(currentSTT); setShowKeyDialog(true) }}
                        className="flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                      >
                        <Key className="w-3 h-3" />
                        Add API key
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Local model — size picker + status */}
              {currentSTT === 'local' && (
                <div className="mt-3 space-y-3">
                  {/* Model size selector */}
                  <div className="flex items-start gap-5">
                    <div className="w-[160px] shrink-0 pt-1">
                      <div className="text-[13px] font-medium text-muted-foreground">Model Size</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex rounded-md border border-border/40 bg-muted/20 p-0.5">
                        {([
                          { value: 'tiny', label: 'Tiny', size: '96 MB' },
                          { value: 'base', label: 'Base', size: '143 MB' },
                          { value: 'small', label: 'Small', size: '300 MB' },
                          { value: 'medium', label: 'Medium', size: '680 MB' },
                          { value: 'large-v3-turbo', label: 'Large', size: '760 MB' },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateSetting('localModelSize', opt.value)}
                            disabled={modelDownloading}
                            title={`~${opt.size} download`}
                            className={`flex-1 rounded-[5px] px-2 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                              modelDownloading ? 'opacity-50 cursor-not-allowed' :
                              settings.localModelSize === opt.value
                                ? 'bg-card shadow-sm text-foreground border border-border/40'
                                : 'text-muted-foreground/60 hover:text-foreground border border-transparent cursor-pointer'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground/40">
                        {settings.localModelSize === 'tiny' && 'Fastest, lower accuracy (~96 MB)'}
                        {settings.localModelSize === 'base' && 'Good balance (~143 MB)'}
                        {settings.localModelSize === 'small' && 'Best quality/size tradeoff (~300 MB)'}
                        {settings.localModelSize === 'medium' && 'High accuracy (~680 MB)'}
                        {settings.localModelSize === 'large-v3-turbo' && 'Best accuracy, needs GPU (~760 MB)'}
                      </p>
                    </div>
                  </div>

                  {/* Model status */}
                  <div className="flex items-center gap-5">
                    <div className="w-[160px] shrink-0">
                      <div className="text-[13px] font-medium text-muted-foreground">Status</div>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      {modelDownloading ? (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="h-1.5 flex-1 max-w-[120px] overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${modelProgress}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground/60 font-medium">{modelProgress}%</span>
                        </div>
                      ) : modelReady ? (
                        <>
                          <span className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
                            <Check className="w-3 h-3" />
                            Model ready
                          </span>
                          <button
                            onClick={async () => {
                              const { getLocalWhisperProvider } = await import('@/lib/stt/provider-factory')
                              const provider = getLocalWhisperProvider()
                              if (provider) {
                                await provider.deleteModel()
                                startDownload() // reset state by triggering re-check
                                window.location.reload()
                              }
                            }}
                            className="text-[11px] text-muted-foreground/40 hover:text-red-400 transition-colors underline"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={startDownload}
                          className="flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          Download model
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Text Processing */}
            <div className="settings-section-enter py-5" style={{ animationDelay: '0.18s' }}>
              <div className="mb-4">
                <div className="text-[14px] font-semibold">Text Processing</div>
                <div className="text-[12px] text-muted-foreground/50">Control how transcriptions are processed</div>
              </div>
              <div className="space-y-0">
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
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Remove filler words</div>
                    <div className="text-[10px] text-muted-foreground/40">Strips um, uh, er, ah from transcription</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">{settings.fillerWordRemoval ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={settings.fillerWordRemoval}
                      onCheckedChange={(v) => updateSetting('fillerWordRemoval', v)}
                    />
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Code mode</div>
                    <div className="text-[10px] text-muted-foreground/40">Optimizes for code dictation</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">{settings.codeMode ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={settings.codeMode}
                      onCheckedChange={(v) => updateSetting('codeMode', v)}
                    />
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Auto-copy to clipboard</div>
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
              </div>
            </div>

            {/* AI Generation */}
            <div className="settings-section-enter py-5" style={{ animationDelay: '0.24s' }}>
              <div className="mb-4">
                <div className="text-[14px] font-semibold">AI Generation</div>
                <div className="text-[12px] text-muted-foreground/50">Content generation behavior</div>
              </div>
              <div className="space-y-0">
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Keyword triggers</div>
                    <div className="text-[10px] text-muted-foreground/40">Detect "write me an email about..." to auto-generate</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">{settings.keywordTriggersEnabled ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={settings.keywordTriggersEnabled}
                      onCheckedChange={(v) => updateSetting('keywordTriggersEnabled', v)}
                    />
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Prompt refinement</div>
                    <div className="text-[10px] text-muted-foreground/40">AI cleans up spoken instructions before generating</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">{settings.promptRefinementEnabled ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={settings.promptRefinementEnabled}
                      onCheckedChange={(v) => updateSetting('promptRefinementEnabled', v)}
                    />
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Output length</div>
                    <div className="text-[10px] text-muted-foreground/40">AI response detail level</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex rounded-md border border-border/40 bg-muted/20 p-0.5">
                      {OUTPUT_LENGTHS.map((l) => (
                        <button
                          key={l.value}
                          onClick={() => updateSetting('outputLength', l.value)}
                          className={`flex-1 rounded-[5px] px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                            settings.outputLength === l.value
                              ? 'bg-card shadow-sm text-foreground border border-border/40'
                              : 'text-muted-foreground/60 hover:text-foreground border border-transparent cursor-pointer'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Clipboard context</div>
                    <div className="text-[10px] text-muted-foreground/40">Reads clipboard to fix names and terms</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">{(settings.useClipboardContext ?? true) ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={settings.useClipboardContext ?? true}
                      onCheckedChange={(v) => updateSetting('useClipboardContext', v)}
                    />
                  </div>
                </div>
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">Active window context</div>
                    <div className="text-[10px] text-muted-foreground/40">Detects active app for better formatting</div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground/60">{(settings.useWindowContext ?? true) ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={settings.useWindowContext ?? true}
                      onCheckedChange={(v) => updateSetting('useWindowContext', v)}
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
                <div className="border-t border-border/10" />
                <div className="flex items-center gap-5 py-3">
                  <div className="w-[160px] shrink-0">
                    <div className="text-[13px] font-medium text-muted-foreground">What's New</div>
                    <div className="text-[10px] text-muted-foreground/40">View latest changes</div>
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => window.electronAPI?.openExternal('https://voxgenflow.vercel.app/whats-new.html')}
                      className="flex items-center gap-1.5 text-[11px] text-primary hover:underline transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      What's New →
                    </button>
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
              <div className="mb-4">
                <div className="text-[14px] font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  License
                </div>
                <div className="text-[12px] text-muted-foreground/50">Manage your subscription</div>
              </div>
              <LicenseInput />
            </div>

            {/* Developer Tools — admin only */}
            {userEmail === ADMIN_EMAIL && <DevTools />}

          </div>
        )}
      </div>

      {/* API Key Dialog */}
      {showKeyDialog && (() => {
        const dialogProvider = keyDialogProvider || currentSTT
        const dialogLabel = dialogProvider === 'openai' ? 'OpenAI' : 'Groq'
        const dialogPlaceholder = dialogProvider === 'openai' ? 'sk-...' : 'gsk_...'
        const dialogHasKey = dialogProvider === 'openai' ? hasOpenAIKey : hasGroqKey
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowKeyDialog(false)} />
            <div className="relative bg-card border border-border rounded-xl shadow-xl p-5 w-[380px] max-w-[90vw]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  <span className="text-[14px] font-semibold">
                    {dialogLabel} API Key
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
                provider={dialogProvider}
                label={dialogLabel}
                placeholder={dialogPlaceholder}
                hasKey={dialogHasKey}
                onSave={async (key, provider) => {
                  const result = await handleSaveKey(key, provider)
                  if (result.success) {
                    // After adding a key, switch to that provider and enable it
                    updateSetting('sttProvider', dialogProvider)
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
        )
      })()}
    </ScrollArea>
  )
}
