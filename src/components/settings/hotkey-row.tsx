import type { LucideIcon } from 'lucide-react'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useSettings } from '@/hooks/useSettings'
import { toast } from '@/hooks/useToast'
import type { AppSettings } from '@/types/settings'

interface HotkeyRowProps {
  label: string
  hotkeyKey: keyof AppSettings
  triggerMethodKey?: keyof AppSettings
  icon?: LucideIcon
}

export function HotkeyRow({ label, hotkeyKey, triggerMethodKey, icon: Icon }: HotkeyRowProps) {
  const { settings, updateSetting } = useSettings()

  const hotkeyValue = settings[hotkeyKey] as string
  const triggerMethodValue = triggerMethodKey
    ? (settings[triggerMethodKey] as 'single' | 'double-tap') || 'single'
    : undefined

  return (
    <div
      className="flex items-center gap-3 py-3"
      role="region"
      aria-label={`${label} hotkey${hotkeyValue ? `: currently set to ${hotkeyValue}` : ''}`}
    >
      <div className="w-[30%] shrink-0">
        <div className="text-[13px] font-medium text-muted-foreground flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground/50" />}
          {label}
        </div>
      </div>
      <div className="w-[40%]">
        <HotkeyRecorder
          value={hotkeyValue}
          onChange={(v) => {
            updateSetting(hotkeyKey, v)
            toast({ title: `${label} hotkey updated`, variant: 'success' })
          }}
          placeholder="Click to set"
          allowClear
        />
      </div>
      {triggerMethodKey && (
        <div className="w-[30%]">
          <RadioGroup
            value={triggerMethodValue}
            onValueChange={(v) => {
              updateSetting(triggerMethodKey, v as 'single' | 'double-tap')
              toast({ title: 'Trigger updated', variant: 'success' })
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id={`${hotkeyKey}-single`} />
              <Label htmlFor={`${hotkeyKey}-single`} className="text-[12px] font-normal cursor-pointer">Single press</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="double-tap" id={`${hotkeyKey}-double`} />
              <Label htmlFor={`${hotkeyKey}-double`} className="text-[12px] font-normal cursor-pointer">Double-tap</Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  )
}
