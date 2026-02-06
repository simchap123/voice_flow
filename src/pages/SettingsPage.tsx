import { useSettings } from '@/hooks/useSettings'
import { ApiKeyInput } from '@/components/settings/ApiKeyInput'
import { LanguageSelect } from '@/components/settings/LanguageSelect'
import { ThemeToggle } from '@/components/settings/ThemeToggle'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/useToast'

export function SettingsPage() {
  const { settings, updateSetting, hasApiKey, saveApiKey } = useSettings()

  const handleHotkeyChange = (hotkey: string) => {
    updateSetting('hotkey', hotkey)
    toast({ title: 'Hotkey updated', description: `Now using ${hotkey}`, variant: 'success' })
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>

        {/* API Key */}
        <ApiKeyInput hasKey={hasApiKey} onSave={saveApiKey} />

        <Separator />

        {/* Language */}
        <LanguageSelect
          value={settings.language}
          onChange={(v) => updateSetting('language', v)}
        />

        <Separator />

        {/* Hotkey */}
        <HotkeyRecorder
          value={settings.hotkey}
          onChange={handleHotkeyChange}
        />

        <Separator />

        {/* GPT Cleanup toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>AI Text Cleanup</Label>
            <p className="text-xs text-muted-foreground">
              Use GPT to remove filler words and fix grammar
            </p>
          </div>
          <Switch
            checked={settings.cleanupEnabled}
            onCheckedChange={(v) => updateSetting('cleanupEnabled', v)}
          />
        </div>

        <Separator />

        {/* Auto-paste toggle */}
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

        <Separator />

        {/* Theme */}
        <ThemeToggle
          theme={settings.theme}
          onChange={(v) => updateSetting('theme', v)}
        />
      </div>
    </ScrollArea>
  )
}
