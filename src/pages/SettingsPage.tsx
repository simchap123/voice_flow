import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/useSettings'
import { Switch } from '@/components/ui/switch'
import { Mic, Zap, Settings as SettingsIcon } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import type { STTProviderType } from '@/lib/stt/types'

const STT_OPTIONS: { value: STTProviderType; label: string }[] = [
  { value: 'groq', label: 'Groq Whisper (fastest)' },
  { value: 'openai', label: 'OpenAI Whisper (accurate)' },
  { value: 'local', label: 'Local (free, offline)' },
]

export function SettingsPage() {
  const { settings, updateSetting, isManagedMode } = useSettings()

  // Build hotkey summary pills
  const holdKey = settings.holdHotkey || 'Alt'
  const promptKey = settings.promptHotkey || ''
  const promptTrigger = settings.promptTriggerMethod || 'single'

  return (
    <ScrollArea className="h-full">
      <div className="page-enter p-6 space-y-3 max-w-[560px]">
        <div className="mb-2">
          <h2 className="text-[16px] font-bold tracking-tight">Settings</h2>
          <p className="text-[11px] text-muted-foreground/50">Recording, providers, and preferences</p>
        </div>

        {/* Card 1: Recording */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
              <Mic className="h-[14px] w-[14px] text-muted-foreground" />
            </div>
            <div>
              <div className="text-[13px] font-semibold">Recording</div>
              <div className="text-[10px] text-muted-foreground/50">Hotkeys and trigger methods</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {holdKey && (
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/30 px-3 py-1.5 text-[11px]">
                <kbd className="rounded-sm border border-border/50 bg-card px-1.5 py-0.5 text-[10px] font-bold">{holdKey}</kbd>
                <span className="text-muted-foreground/70">Hold to record</span>
              </div>
            )}
            {promptKey && (
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/30 px-3 py-1.5 text-[11px]">
                {promptTrigger === 'double-tap' ? (
                  <>
                    <kbd className="rounded-sm border border-border/50 bg-card px-1.5 py-0.5 text-[10px] font-bold">{promptKey}</kbd>
                    <kbd className="rounded-sm border border-border/50 bg-card px-1.5 py-0.5 text-[10px] font-bold">{promptKey}</kbd>
                  </>
                ) : (
                  <kbd className="rounded-sm border border-border/50 bg-card px-1.5 py-0.5 text-[10px] font-bold">{promptKey}</kbd>
                )}
                <span className="text-muted-foreground/70">
                  {promptTrigger === 'double-tap' ? 'Double-tap for AI Prompt' : 'AI Prompt'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: STT Provider */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
              <Zap className="h-[14px] w-[14px] text-muted-foreground" />
            </div>
            <div>
              <div className="text-[13px] font-semibold">STT Provider</div>
              <div className="text-[10px] text-muted-foreground/50">Speech-to-text engine</div>
            </div>
          </div>
          <select
            value={isManagedMode ? 'groq' : settings.sttProvider}
            onChange={(e) => {
              if (!isManagedMode) {
                updateSetting('sttProvider', e.target.value as STTProviderType)
                toast({ title: 'STT provider updated', variant: 'success' })
              }
            }}
            disabled={isManagedMode}
            className="w-full rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-[12px] font-medium text-foreground outline-none transition-colors focus:border-primary/40"
          >
            {STT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Card 3: Preferences */}
        <div className="rounded-lg border border-border/30 bg-card/70 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
              <SettingsIcon className="h-[14px] w-[14px] text-muted-foreground" />
            </div>
            <div>
              <div className="text-[13px] font-semibold">Preferences</div>
              <div className="text-[10px] text-muted-foreground/50">Behavior settings</div>
            </div>
          </div>
          <div className="space-y-0">
            <div className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-[12px] font-medium">Auto-paste</div>
                <div className="text-[10px] text-muted-foreground/50">Type text into focused app after transcription</div>
              </div>
              <Switch
                checked={settings.autoCopy ?? true}
                onCheckedChange={(v) => updateSetting('autoCopy', v)}
              />
            </div>
            <div className="border-t border-border/20" />
            <div className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-[12px] font-medium">AI Cleanup</div>
                <div className="text-[10px] text-muted-foreground/50">Fix grammar and remove filler words</div>
              </div>
              <Switch
                checked={settings.cleanupEnabled}
                onCheckedChange={(v) => updateSetting('cleanupEnabled', v)}
              />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
