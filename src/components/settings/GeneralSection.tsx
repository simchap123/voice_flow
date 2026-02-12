import { useSettings } from '@/hooks/useSettings'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { LanguageSelect } from '@/components/settings/LanguageSelect'
import { MicrophoneSelect } from '@/components/settings/MicrophoneSelect'
import { ThemeToggle } from '@/components/settings/ThemeToggle'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/useToast'

export function GeneralSection() {
  const { settings, updateSetting } = useSettings()

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-sm text-muted-foreground">Hotkeys, language, and display preferences</p>
      </div>

      {/* Hotkeys */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Hotkeys</CardTitle>
          <CardDescription>Configure keyboard shortcuts for recording</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <HotkeyRecorder
            value={settings.holdHotkey}
            onChange={handleHoldHotkeyChange}
            label="Hold-to-Record Hotkey"
            description="Hold to speak, release to stop. Try Alt+J or Ctrl+Space to avoid conflicts"
            allowClear
          />
          <HotkeyRecorder
            value={settings.toggleHotkey}
            onChange={handleToggleHotkeyChange}
            label="Toggle Hotkey"
            description="Press once to start recording, press again to stop and paste"
            allowClear
          />
          <HotkeyRecorder
            value={settings.promptHotkey}
            onChange={handlePromptHotkeyChange}
            label="AI Prompt Hotkey"
            description="Press to start, speak instructions, press again — AI generates full content"
            allowClear
          />
          <HotkeyRecorder
            value={settings.doubleTapHotkey}
            onChange={handleDoubleTapHotkeyChange}
            label="Double-Tap Hotkey"
            description="Double-press a modifier key (Alt, Ctrl, Shift, or Windows) to start/stop"
            allowClear
          />
        </CardContent>
      </Card>

      {/* Language & Microphone */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Recording</CardTitle>
          <CardDescription>Language and audio input settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <MicrophoneSelect
            value={settings.audioInputDeviceId}
            onChange={(v) => updateSetting('audioInputDeviceId', v)}
          />
          <LanguageSelect
            value={settings.language}
            onChange={(v) => updateSetting('language', v)}
          />
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
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

          <ThemeToggle
            theme={settings.theme}
            onChange={(v) => updateSetting('theme', v)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
