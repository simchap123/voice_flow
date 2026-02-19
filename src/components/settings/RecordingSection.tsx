import { useSettings } from '@/hooks/useSettings'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { LanguageSelect } from '@/components/settings/LanguageSelect'
import { MicrophoneSelect } from '@/components/settings/MicrophoneSelect'
import { ThemeToggle } from '@/components/settings/ThemeToggle'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/hooks/useToast'

type TriggerMethod = 'hold' | 'single' | 'double-tap'

export function RecordingSection() {
  const { settings, updateSetting } = useSettings()

  // Mode 1: Hold-to-Record (always hold, not configurable)
  const handleHoldModeKeyChange = (hotkey: string) => {
    updateSetting('holdHotkey', hotkey)
    toast({ title: 'Hold-to-Record updated', description: hotkey ? `Hold ${hotkey} to record` : 'Disabled', variant: 'success' })
  }

  // Mode 2: Toggle Recording
  const handleToggleModeKeyChange = (hotkey: string) => {
    updateSetting('toggleHotkey', hotkey)
    toast({ title: 'Toggle mode updated', variant: 'success' })
  }

  const handleToggleTriggerChange = (trigger: TriggerMethod) => {
    updateSetting('toggleTriggerMethod', trigger)
    toast({ title: 'Toggle trigger updated', description: trigger === 'single' ? 'Single press' : 'Double-tap', variant: 'success' })
  }

  // Mode 3: AI Prompt
  const handlePromptModeKeyChange = (hotkey: string) => {
    updateSetting('promptHotkey', hotkey)
    toast({ title: 'AI Prompt mode updated', variant: 'success' })
  }

  const handlePromptTriggerChange = (trigger: TriggerMethod) => {
    updateSetting('promptTriggerMethod', trigger)
    toast({ title: 'AI Prompt trigger updated', description: trigger === 'single' ? 'Single press' : 'Double-tap', variant: 'success' })
  }

  const toggleTrigger = (settings.toggleTriggerMethod || 'single') as TriggerMethod
  const promptTrigger = (settings.promptTriggerMethod || 'single') as TriggerMethod

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Recording</h2>
        <p className="text-sm text-muted-foreground">Recording modes, hotkeys, and preferences</p>
      </div>

      {/* Recording Modes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Recording Modes</CardTitle>
          <CardDescription>Configure keyboard shortcuts and trigger methods for each mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode 1: Hold-to-Record */}
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <span className="text-lg">⏸</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Hold-to-Record</h3>
                <p className="text-xs text-muted-foreground">Hold key to speak, release to stop</p>
              </div>
            </div>
            <HotkeyRecorder
              value={settings.holdHotkey}
              onChange={handleHoldModeKeyChange}
              label="Hotkey"
              description="Try Alt, Ctrl+Space, or Alt+J to avoid conflicts"
              allowClear
            />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Trigger:</span> Hold (always)
            </div>
          </div>

          {/* Mode 2: Toggle Recording */}
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <span className="text-lg">🔄</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Toggle Recording</h3>
                <p className="text-xs text-muted-foreground">Press once to start, again to stop and paste</p>
              </div>
            </div>
            <HotkeyRecorder
              value={settings.toggleHotkey}
              onChange={handleToggleModeKeyChange}
              label="Hotkey"
              description="Press to toggle recording on/off"
              allowClear
            />
            <div className="space-y-2">
              <Label className="text-xs font-medium">Trigger Method</Label>
              <RadioGroup value={toggleTrigger} onValueChange={(v) => handleToggleTriggerChange(v as TriggerMethod)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="toggle-single" />
                  <Label htmlFor="toggle-single" className="text-xs font-normal cursor-pointer">Single press</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="double-tap" id="toggle-double" />
                  <Label htmlFor="toggle-double" className="text-xs font-normal cursor-pointer">Double-tap</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Mode 3: AI Prompt */}
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <span className="text-lg">✨</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold">AI Prompt</h3>
                <p className="text-xs text-muted-foreground">Speak instructions, AI generates full content</p>
              </div>
            </div>
            <HotkeyRecorder
              value={settings.promptHotkey}
              onChange={handlePromptModeKeyChange}
              label="Hotkey"
              description="Press to start, speak, press again — AI generates content"
              allowClear
            />
            <div className="space-y-2">
              <Label className="text-xs font-medium">Trigger Method</Label>
              <RadioGroup value={promptTrigger} onValueChange={(v) => handlePromptTriggerChange(v as TriggerMethod)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="prompt-single" />
                  <Label htmlFor="prompt-single" className="text-xs font-normal cursor-pointer">Single press</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="double-tap" id="prompt-double" />
                  <Label htmlFor="prompt-double" className="text-xs font-normal cursor-pointer">Double-tap</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language & Microphone */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Recording</CardTitle>
          <CardDescription>Language and audio input settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <CardDescription>Display and behavior settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto-paste after transcription</Label>
              <p className="text-xs text-muted-foreground">Automatically paste transcribed text</p>
            </div>
            <Switch
              checked={settings.autoCopy ?? true}
              onCheckedChange={(checked) => updateSetting('autoCopy', checked)}
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
