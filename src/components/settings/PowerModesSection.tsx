import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { PREDEFINED_PROMPTS } from '@/lib/cleanup/predefined-prompts'
import type { PowerMode, AppMatcher } from '@/types/power-mode'
import type { CustomPrompt } from '@/types/custom-prompt'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/useToast'
import { Plus, Pencil, Trash2, X, Check, Zap } from 'lucide-react'

const STT_OPTIONS = [
  { value: '', label: 'Use default' },
  { value: 'openai', label: 'OpenAI Whisper' },
  { value: 'groq', label: 'Groq Whisper' },
  { value: 'deepgram', label: 'Deepgram' },
] as const

const CLEANUP_OPTIONS = [
  { value: '', label: 'Use default' },
  { value: 'openai', label: 'OpenAI GPT-4o-mini' },
  { value: 'groq', label: 'Groq Llama' },
  { value: 'none', label: 'None (disabled)' },
] as const

function newBlankMode(): Omit<PowerMode, 'id'> {
  return {
    name: '',
    emoji: '⚡',
    appMatchers: [],
    urlMatchers: [],
    selectedPromptId: 'default',
    sttProvider: undefined,
    cleanupProvider: undefined,
    isEnabled: true,
  }
}

interface ModeFormProps {
  draft: Omit<PowerMode, 'id'>
  onChange: (draft: Omit<PowerMode, 'id'>) => void
  allPrompts: CustomPrompt[]
}

function ModeForm({ draft, onChange, allPrompts }: ModeFormProps) {
  const appProcessText = draft.appMatchers.map(a => a.processName).join(', ')
  const urlPatternsText = draft.urlMatchers.join('\n')

  function setAppProcesses(raw: string) {
    const matchers: AppMatcher[] = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => ({ processName: s, displayName: s }))
    onChange({ ...draft, appMatchers: matchers })
  }

  function setUrlPatterns(raw: string) {
    const patterns = raw.split('\n').map(s => s.trim()).filter(Boolean)
    onChange({ ...draft, urlMatchers: patterns })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Emoji"
          value={draft.emoji}
          onChange={e => onChange({ ...draft, emoji: e.target.value })}
          className="w-14 text-center text-base"
          maxLength={2}
        />
        <Input
          placeholder="Mode name (e.g. Outlook Email)"
          value={draft.name}
          onChange={e => onChange({ ...draft, name: e.target.value })}
          className="flex-1 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">App process names (comma-separated)</label>
        <Input
          placeholder="chrome, outlook, slack"
          value={appProcessText}
          onChange={e => setAppProcesses(e.target.value)}
          className="text-sm font-mono"
        />
        <p className="text-[11px] text-muted-foreground/60">
          Matches when the foreground app process name contains any of these strings
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Window title patterns (one per line)</label>
        <textarea
          placeholder="Gmail&#10;Outlook&#10;compose"
          value={urlPatternsText}
          onChange={e => setUrlPatterns(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
        />
        <p className="text-[11px] text-muted-foreground/60">
          Matches when the active window title contains any of these strings (checked before process names)
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Prompt</label>
        <select
          value={draft.selectedPromptId}
          onChange={e => onChange({ ...draft, selectedPromptId: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {allPrompts.map(p => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">STT Provider override</label>
          <select
            value={draft.sttProvider ?? ''}
            onChange={e => onChange({ ...draft, sttProvider: (e.target.value as PowerMode['sttProvider']) || undefined })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {STT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Cleanup override</label>
          <select
            value={draft.cleanupProvider ?? ''}
            onChange={e => onChange({ ...draft, cleanupProvider: (e.target.value as PowerMode['cleanupProvider']) || undefined })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {CLEANUP_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export function PowerModesSection() {
  const { settings, updateSetting } = useSettings()
  const [powerModes, setPowerModes] = useState<PowerMode[]>([])
  const [userPrompts, setUserPrompts] = useState<CustomPrompt[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<PowerMode, 'id'>>(newBlankMode())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newModeDraft, setNewModeDraft] = useState<Omit<PowerMode, 'id'>>(newBlankMode())

  useEffect(() => {
    window.electronAPI?.getPowerModes?.().then(m => setPowerModes(m ?? []))
    window.electronAPI?.getCustomPrompts?.().then(p => setUserPrompts(p ?? []))
  }, [])

  const allPrompts: CustomPrompt[] = [
    ...PREDEFINED_PROMPTS.map(p => {
      const override = userPrompts.find(u => u.id === p.id)
      return override ? { ...p, ...override, isPredefined: true } : p
    }),
    ...userPrompts.filter(p => !PREDEFINED_PROMPTS.some(pre => pre.id === p.id)),
  ]

  async function saveModes(updated: PowerMode[]) {
    setPowerModes(updated)
    await window.electronAPI?.setPowerModes?.(updated)
  }

  function startEdit(mode: PowerMode) {
    setEditingId(mode.id)
    setEditDraft({
      name: mode.name,
      emoji: mode.emoji,
      appMatchers: mode.appMatchers,
      urlMatchers: mode.urlMatchers,
      selectedPromptId: mode.selectedPromptId,
      sttProvider: mode.sttProvider,
      cleanupProvider: mode.cleanupProvider,
      isEnabled: mode.isEnabled,
    })
  }

  async function saveEdit() {
    if (!editingId) return
    await saveModes(powerModes.map(m => m.id === editingId ? { ...m, ...editDraft } : m))
    setEditingId(null)
    toast({ title: 'Power mode saved', variant: 'success' })
  }

  async function deleteMode(id: string) {
    await saveModes(powerModes.filter(m => m.id !== id))
    toast({ title: 'Power mode deleted', variant: 'success' })
  }

  async function addMode() {
    if (!newModeDraft.name.trim()) return
    const mode: PowerMode = {
      ...newModeDraft,
      id: window.crypto.randomUUID(),
    }
    await saveModes([...powerModes, mode])
    setNewModeDraft(newBlankMode())
    setShowAddForm(false)
    toast({ title: 'Power mode added', variant: 'success' })
  }

  async function toggleMode(id: string, enabled: boolean) {
    await saveModes(powerModes.map(m => m.id === id ? { ...m, isEnabled: enabled } : m))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Power Modes</h2>
        <p className="text-sm text-muted-foreground">
          Auto-detect the active application and apply custom AI settings — prompt, STT provider, and cleanup — per context.
        </p>
      </div>

      {/* Master toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium">Enable Power Modes</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Automatically apply mode overrides based on the focused app at recording start
          </p>
        </div>
        <button
          onClick={() => updateSetting('powerModesEnabled', !settings.powerModesEnabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            settings.powerModesEnabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            settings.powerModesEnabled ? 'translate-x-4' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {/* Mode list */}
      {powerModes.length > 0 && (
        <div className="space-y-3">
          {powerModes.map(mode => {
            const isEditing = editingId === mode.id
            const linkedPrompt = allPrompts.find(p => p.id === mode.selectedPromptId)
            return (
              <Card key={mode.id}>
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">{mode.emoji}</span>
                      <div className="min-w-0">
                        <CardTitle className="text-sm">{mode.name}</CardTitle>
                        {!isEditing && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {mode.appMatchers.map(a => (
                              <span key={a.processName} className="text-[10px] bg-muted rounded px-1.5 py-px font-mono text-muted-foreground">
                                {a.processName}
                              </span>
                            ))}
                            {mode.urlMatchers.map(u => (
                              <span key={u} className="text-[10px] bg-muted rounded px-1.5 py-px font-mono text-muted-foreground italic">
                                "{u}"
                              </span>
                            ))}
                            {linkedPrompt && (
                              <span className="text-[10px] text-muted-foreground/70 ml-1">
                                → {linkedPrompt.icon} {linkedPrompt.title}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Enable toggle */}
                      {!isEditing && (
                        <button
                          onClick={() => toggleMode(mode.id, !mode.isEnabled)}
                          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                            mode.isEnabled ? 'bg-primary' : 'bg-muted'
                          }`}
                          title={mode.isEnabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                            mode.isEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                          }`} />
                        </button>
                      )}

                      {isEditing ? (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}>
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => { setEditingId(null) }}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(mode)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-destructive"
                            onClick={() => deleteMode(mode.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isEditing && (
                  <CardContent className="pb-4">
                    <ModeForm draft={editDraft} onChange={setEditDraft} allPrompts={allPrompts} />
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Add form */}
      {showAddForm ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">New Power Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ModeForm draft={newModeDraft} onChange={setNewModeDraft} allPrompts={allPrompts} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewModeDraft(newBlankMode()) }}>
                Cancel
              </Button>
              <Button size="sm" onClick={addMode} disabled={!newModeDraft.name.trim()}>
                Add Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full gap-2" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4" />
          Add Power Mode
        </Button>
      )}

      {powerModes.length === 0 && !showAddForm && (
        <div className="rounded-lg border border-dashed border-border/50 p-6 text-center">
          <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No power modes yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Add a mode to auto-apply AI settings based on the active app.
          </p>
        </div>
      )}
    </div>
  )
}
