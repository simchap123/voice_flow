import { useSettings } from '@/hooks/useSettings'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { LanguageSelect } from '@/components/settings/LanguageSelect'
import { MicrophoneSelect } from '@/components/settings/MicrophoneSelect'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/hooks/useToast'

type TriggerMethod = 'hold' | 'single' | 'double-tap'

export function RecordingSection() {
  const { settings, updateSetting } = useSettings()

  const handleHoldModeKeyChange = (hotkey: string) => {
    updateSetting('holdHotkey', hotkey)
    toast({ title: 'Hold-to-Record updated', description: hotkey ? `Hold ${hotkey} to record` : 'Disabled', variant: 'success' })
  }

  const handleToggleModeKeyChange = (hotkey: string) => {
    updateSetting('toggleHotkey', hotkey)
    toast({ title: 'Toggle mode updated', variant: 'success' })
  }

  const handleToggleTriggerChange = (trigger: TriggerMethod) => {
    updateSetting('toggleTriggerMethod', trigger)
    toast({ title: 'Toggle trigger updated', description: trigger === 'single' ? 'Single press' : 'Double-tap', variant: 'success' })
  }

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
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Recording</h2>
        <p className="text-[12px] text-muted-foreground/60">Recording modes, hotkeys, and preferences</p>
      </div>

      {/* Recording Modes */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border/30 px-5 py-4">
          <h3 className="text-[13px] font-semibold">Recording Modes</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">Configure keyboard shortcuts and trigger methods</p>
        </div>
        <div className="space-y-4 p-5">
          {/* Mode 1: Hold-to-Record */}
          <div className="space-y-3 rounded-xl border border-border/30 bg-muted/20 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-base">⏸</span>
              </div>
              <div>
                <h4 className="text-[13px] font-medium">Hold-to-Record</h4>
                <p className="text-[11px] text-muted-foreground/60">Hold key to speak, release to stop</p>
              </div>
            </div>
            <HotkeyRecorder
              value={settings.holdHotkey}
              onChange={handleHoldModeKeyChange}
              label="Hotkey"
              description="Try Alt, Ctrl+Space, or Alt+J to avoid conflicts"
              allowClear
            />
            <div className="text-[11px] text-muted-foreground/50">
              <span className="font-medium">Trigger:</span> Hold (always)
            </div>
          </div>

          {/* Mode 2: Toggle Recording */}
          <div className="space-y-3 rounded-xl border border-border/30 bg-muted/20 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-base">🔄</span>
              </div>
              <div>
                <h4 className="text-[13px] font-medium">Toggle Recording</h4>
                <p className="text-[11px] text-muted-foreground/60">Press once to start, again to stop and paste</p>
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
              <Label className="text-[11px] font-medium">Trigger Method</Label>
              <RadioGroup value={toggleTrigger} onValueChange={(v) => handleToggleTriggerChange(v as TriggerMethod)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="toggle-single" />
                  <Label htmlFor="toggle-single" className="text-[12px] font-normal cursor-pointer">Single press</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="double-tap" id="toggle-double" />
                  <Label htmlFor="toggle-double" className="text-[12px] font-normal cursor-pointer">Double-tap</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Mode 3: AI Prompt */}
          <div className="space-y-3 rounded-xl border border-border/30 bg-muted/20 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-base">✨</span>
              </div>
              <div>
                <h4 className="text-[13px] font-medium">AI Prompt</h4>
                <p className="text-[11px] text-muted-foreground/60">Speak instructions, AI generates full content</p>
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
              <Label className="text-[11px] font-medium">Trigger Method</Label>
              <RadioGroup value={promptTrigger} onValueChange={(v) => handlePromptTriggerChange(v as TriggerMethod)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="prompt-single" />
                  <Label htmlFor="prompt-single" className="text-[12px] font-normal cursor-pointer">Single press</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="double-tap" id="prompt-double" />
                  <Label htmlFor="prompt-double" className="text-[12px] font-normal cursor-pointer">Double-tap</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>

      {/* Language & Microphone */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border/30 px-5 py-4">
          <h3 className="text-[13px] font-semibold">Audio Input</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">Language and microphone settings</p>
        </div>
        <div className="space-y-4 p-5">
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

      {/* Preferences */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border/30 px-5 py-4">
          <h3 className="text-[13px] font-semibold">Preferences</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">Display and behavior settings</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[13px] font-medium">Auto-paste after transcription</Label>
              <p className="text-[11px] text-muted-foreground/60">Automatically paste transcribed text</p>
            </div>
            <Switch
              checked={settings.autoCopy ?? true}
              onCheckedChange={(checked) => updateSetting('autoCopy', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
