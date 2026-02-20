import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/useSettings'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PromptsSection } from '@/components/settings/PromptsSection'
import { toast } from '@/hooks/useToast'
import type { OutputLength } from '@/lib/cleanup/types'

const OUTPUT_LENGTHS: { value: OutputLength; label: string; description: string }[] = [
  { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
  { value: 'medium', label: 'Medium', description: 'Balanced level of detail' },
  { value: 'detailed', label: 'Detailed', description: 'Thorough with examples' },
]

export function AIPromptModePage() {
  const { settings, updateSetting } = useSettings()

  return (
    <ScrollArea className="h-full">
      <div className="page-enter p-6 space-y-3 max-w-[560px]">
        <div className="mb-2">
          <h2 className="text-[16px] font-bold tracking-tight">AI Prompt</h2>
          <p className="text-[11px] text-muted-foreground/50">Speak instructions, AI generates full content</p>
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

        {/* Generation Settings */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4">
          <div className="mb-3">
            <div className="text-[13px] font-semibold">Generation</div>
            <div className="text-[10px] text-muted-foreground/50">Content generation behavior</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-[12px] font-medium">Keyword Triggers</div>
                <div className="text-[10px] text-muted-foreground/50">Detect "write me an email about..." to auto-generate</div>
              </div>
              <Switch checked={settings.keywordTriggersEnabled} onCheckedChange={(v) => updateSetting('keywordTriggersEnabled', v)} />
            </div>
            <div className="border-t border-border/20" />
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-[12px] font-medium">Prompt Refinement</div>
                <div className="text-[10px] text-muted-foreground/50">AI cleans up spoken instructions before generating</div>
              </div>
              <Switch checked={settings.promptRefinementEnabled} onCheckedChange={(v) => updateSetting('promptRefinementEnabled', v)} />
            </div>
            <div className="border-t border-border/20" />
            <div className="space-y-2 pt-1">
              <div className="text-[12px] font-medium">Output Length</div>
              <div className="flex rounded-md border border-border/40 bg-muted/20 p-0.5">
                {OUTPUT_LENGTHS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => updateSetting('outputLength', l.value)}
                    className={`flex-1 rounded-[5px] px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                      settings.outputLength === l.value
                        ? 'bg-card shadow-sm text-foreground border border-border/40'
                        : 'text-muted-foreground/60 hover:text-foreground border border-transparent'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Context */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4">
          <div className="mb-3">
            <div className="text-[13px] font-semibold">Context</div>
            <div className="text-[10px] text-muted-foreground/50">Extra context for better AI results</div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[12px] font-medium">Clipboard context</div>
              <div className="text-[10px] text-muted-foreground/50">Reads clipboard to fix names and terms</div>
            </div>
            <Switch checked={settings.useClipboardContext ?? true} onCheckedChange={(v) => updateSetting('useClipboardContext', v)} />
          </div>
          <div className="border-t border-border/20" />
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[12px] font-medium">Active window context</div>
              <div className="text-[10px] text-muted-foreground/50">Detects active app for better formatting</div>
            </div>
            <Switch checked={settings.useWindowContext ?? true} onCheckedChange={(v) => updateSetting('useWindowContext', v)} />
          </div>
        </div>

        {/* Prompts */}
        <PromptsSection />
      </div>
    </ScrollArea>
  )
}
