import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/useSettings'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { LanguageSelect } from '@/components/settings/LanguageSelect'
import { MicrophoneSelect } from '@/components/settings/MicrophoneSelect'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/hooks/useToast'

export function DictationModePage() {
  const { settings, updateSetting } = useSettings()

  return (
    <ScrollArea className="h-full">
      <div className="page-enter p-6 space-y-3 max-w-[560px]">
        <div className="mb-2">
          <h2 className="text-[16px] font-bold tracking-tight">Dictation</h2>
          <p className="text-[11px] text-muted-foreground/50">Hold-to-record and toggle recording configuration</p>
        </div>

        {/* Hold-to-Record */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4 space-y-3">
          <div>
            <div className="text-[13px] font-semibold">Hold-to-Record</div>
            <div className="text-[10px] text-muted-foreground/50">Hold key to speak, release to stop</div>
          </div>
          <HotkeyRecorder
            value={settings.holdHotkey}
            onChange={(v) => {
              updateSetting('holdHotkey', v)
              toast({ title: 'Hold hotkey updated', variant: 'success' })
            }}
            label="Hotkey"
            description="Try Alt, Ctrl+Space, or Alt+J"
            allowClear
          />
        </div>

        {/* Toggle Recording */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4 space-y-3">
          <div>
            <div className="text-[13px] font-semibold">Toggle Recording</div>
            <div className="text-[10px] text-muted-foreground/50">Press once to start, again to stop and paste</div>
          </div>
          <HotkeyRecorder
            value={settings.toggleHotkey}
            onChange={(v) => {
              updateSetting('toggleHotkey', v)
              toast({ title: 'Toggle hotkey updated', variant: 'success' })
            }}
            label="Hotkey"
            description="Press to toggle recording on/off"
            allowClear
          />
          <div className="space-y-2">
            <Label className="text-[11px] font-medium">Trigger Method</Label>
            <RadioGroup
              value={settings.toggleTriggerMethod || 'single'}
              onValueChange={(v) => {
                updateSetting('toggleTriggerMethod', v as 'single' | 'double-tap')
                toast({ title: 'Trigger updated', variant: 'success' })
              }}
            >
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

        {/* Audio Input */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4 space-y-3">
          <div>
            <div className="text-[13px] font-semibold">Audio Input</div>
            <div className="text-[10px] text-muted-foreground/50">Language and microphone settings</div>
          </div>
          <MicrophoneSelect
            value={settings.audioInputDeviceId}
            onChange={(v) => updateSetting('audioInputDeviceId', v)}
          />
          <LanguageSelect
            value={settings.language}
            onChange={(v) => updateSetting('language', v)}
          />
        </div>

        {/* Options */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4">
          <div className="mb-3">
            <div className="text-[13px] font-semibold">Options</div>
            <div className="text-[10px] text-muted-foreground/50">Dictation behavior</div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[12px] font-medium">Code Mode</div>
              <div className="text-[10px] text-muted-foreground/50">Convert spoken words to code syntax</div>
            </div>
            <Switch checked={settings.codeMode} onCheckedChange={(v) => updateSetting('codeMode', v)} />
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
