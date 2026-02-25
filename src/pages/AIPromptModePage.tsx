import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/useSettings'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/hooks/useToast'

interface AIPromptModePageProps {
  onNavigate: (page: string) => void
}

export function AIPromptModePage({ onNavigate }: AIPromptModePageProps) {
  const { settings, updateSetting } = useSettings()

  return (
    <ScrollArea className="h-full">
      <div className="page-enter p-6 space-y-3 max-w-[560px]">
        <div className="mb-2">
          <h2 className="text-[16px] font-bold tracking-tight">AI Prompt</h2>
          <p className="text-[11px] text-muted-foreground/50">Speak a prompt to generate AI content. Use keyword triggers to activate generation.</p>
        </div>

        {/* Hotkey */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4 space-y-3">
          <div>
            <div className="text-[13px] font-semibold">Hotkey</div>
            <div className="text-[10px] text-muted-foreground/50">Press to start, speak, press again — AI generates content</div>
          </div>
          <div className="flex items-center gap-2">
            <HotkeyRecorder
              value={settings.promptHotkey}
              onChange={(v) => {
                updateSetting('promptHotkey', v)
                toast({ title: 'AI Prompt hotkey updated', variant: 'success' })
              }}
              placeholder="Click to set"
              allowClear
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-medium">Trigger Method</Label>
            <RadioGroup
              value={settings.promptTriggerMethod || 'single'}
              onValueChange={(v) => {
                updateSetting('promptTriggerMethod', v as 'single' | 'double-tap')
                toast({ title: 'Trigger updated', variant: 'success' })
              }}
            >
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

        {/* Link to AI Prompts page */}
        <button
          type="button"
          onClick={() => onNavigate('ai-prompts')}
          aria-label="Manage AI Prompts"
          className="text-primary text-sm hover:underline transition-colors"
        >
          Manage AI Prompts →
        </button>
      </div>
    </ScrollArea>
  )
}
