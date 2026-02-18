import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { PREDEFINED_PROMPTS } from '@/lib/cleanup/predefined-prompts'
import type { CustomPrompt } from '@/types/custom-prompt'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/useToast'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { randomUUID } from 'crypto'

export function PromptsSection() {
  const { settings, updateSetting } = useSettings()
  const [userPrompts, setUserPrompts] = useState<CustomPrompt[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<CustomPrompt>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPrompt, setNewPrompt] = useState({ title: '', icon: '🎙️', description: '', promptText: '' })

  useEffect(() => {
    window.electronAPI?.getCustomPrompts?.().then(p => setUserPrompts(p ?? []))
  }, [])

  async function saveUserPrompts(updated: CustomPrompt[]) {
    setUserPrompts(updated)
    await window.electronAPI?.setCustomPrompts?.(updated)
  }

  function selectPrompt(id: string) {
    updateSetting('activePromptId', id)
    toast({ title: 'Prompt activated', variant: 'success' })
  }

  // ── Edit predefined/user prompts ───────────────────────────────────────
  function startEdit(prompt: CustomPrompt) {
    setEditingId(prompt.id)
    setEditDraft({ promptText: prompt.promptText, title: prompt.title, description: prompt.description, icon: prompt.icon })
  }

  async function saveEdit(prompt: CustomPrompt) {
    if (prompt.isPredefined) {
      // Predefined prompts store edits in userPrompts as overrides
      const existingOverride = userPrompts.find(p => p.id === prompt.id)
      if (existingOverride) {
        await saveUserPrompts(userPrompts.map(p => p.id === prompt.id ? { ...p, ...editDraft } : p))
      } else {
        await saveUserPrompts([...userPrompts, { ...prompt, ...editDraft, isPredefined: false }])
      }
    } else {
      await saveUserPrompts(userPrompts.map(p => p.id === prompt.id ? { ...p, ...editDraft } : p))
    }
    setEditingId(null)
    setEditDraft({})
    toast({ title: 'Prompt saved', variant: 'success' })
  }

  async function deleteUserPrompt(id: string) {
    await saveUserPrompts(userPrompts.filter(p => p.id !== id))
    if (settings.activePromptId === id) updateSetting('activePromptId', 'default')
    toast({ title: 'Prompt deleted', variant: 'success' })
  }

  async function addCustomPrompt() {
    if (!newPrompt.title.trim() || !newPrompt.promptText.trim()) return
    const prompt: CustomPrompt = {
      id: crypto.randomUUID(),
      title: newPrompt.title.trim(),
      icon: newPrompt.icon || '🎙️',
      description: newPrompt.description.trim(),
      promptText: newPrompt.promptText.trim(),
      triggerWords: [],
      useSystemInstructions: true,
      isPredefined: false,
      isActive: false,
      createdAt: Date.now(),
    }
    await saveUserPrompts([...userPrompts, prompt])
    setNewPrompt({ title: '', icon: '🎙️', description: '', promptText: '' })
    setShowAddForm(false)
    toast({ title: 'Custom prompt added', variant: 'success' })
  }

  const activeId = settings.activePromptId ?? 'default'

  // Merge predefined with user overrides
  const allPrompts: CustomPrompt[] = [
    ...PREDEFINED_PROMPTS.map(p => {
      const override = userPrompts.find(u => u.id === p.id)
      return override ? { ...p, ...override, isPredefined: true } : p
    }),
    ...userPrompts.filter(p => !PREDEFINED_PROMPTS.some(pre => pre.id === p.id)),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AI Prompts</h2>
        <p className="text-sm text-muted-foreground">
          Choose how the AI cleans up your dictation. The active prompt replaces the default cleanup instructions.
        </p>
      </div>

      {/* Prompt list */}
      <div className="space-y-3">
        {allPrompts.map((prompt) => {
          const isActive = prompt.id === activeId
          const isEditing = editingId === prompt.id

          return (
            <Card
              key={prompt.id}
              className={`transition-colors cursor-pointer ${
                isActive ? 'border-primary/50 bg-primary/5' : 'hover:border-border'
              }`}
              onClick={() => !isEditing && selectPrompt(prompt.id)}
            >
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{editDraft.icon && isEditing ? editDraft.icon : prompt.icon}</span>
                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={editDraft.icon ?? prompt.icon}
                            onChange={e => setEditDraft(d => ({ ...d, icon: e.target.value }))}
                            className="w-14 text-sm text-center"
                            maxLength={2}
                            onClick={e => e.stopPropagation()}
                          />
                          <Input
                            value={editDraft.title ?? prompt.title}
                            onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))}
                            className="text-sm font-medium"
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <CardTitle className="text-sm flex items-center gap-2">
                          {prompt.title}
                          {prompt.isPredefined && (
                            <span className="text-[10px] font-normal text-muted-foreground/60 border border-border/50 rounded px-1">
                              built-in
                            </span>
                          )}
                        </CardTitle>
                      )}
                      {!isEditing && (
                        <CardDescription className="text-xs mt-0.5">{prompt.description}</CardDescription>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isActive && !isEditing && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                        Active
                      </span>
                    )}
                    {isEditing ? (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={e => { e.stopPropagation(); saveEdit(prompt) }}>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={e => { e.stopPropagation(); setEditingId(null); setEditDraft({}) }}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={e => { e.stopPropagation(); startEdit(prompt) }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!prompt.isPredefined && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-destructive"
                            onClick={e => { e.stopPropagation(); deleteUserPrompt(prompt.id) }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-4">
                {isEditing ? (
                  <textarea
                    value={editDraft.promptText ?? prompt.promptText}
                    onChange={e => setEditDraft(d => ({ ...d, promptText: e.target.value }))}
                    onClick={e => e.stopPropagation()}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y min-h-[120px] focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                ) : (
                  <p className="text-xs font-mono text-muted-foreground/70 line-clamp-3 whitespace-pre-line">
                    {prompt.promptText}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add custom prompt */}
      {showAddForm ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">New Custom Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Icon (emoji)"
                value={newPrompt.icon}
                onChange={e => setNewPrompt(p => ({ ...p, icon: e.target.value }))}
                className="w-16 text-center text-sm"
                maxLength={2}
              />
              <Input
                placeholder="Title"
                value={newPrompt.title}
                onChange={e => setNewPrompt(p => ({ ...p, title: e.target.value }))}
                className="text-sm flex-1"
              />
            </div>
            <Input
              placeholder="Description (optional)"
              value={newPrompt.description}
              onChange={e => setNewPrompt(p => ({ ...p, description: e.target.value }))}
              className="text-sm"
            />
            <textarea
              placeholder="AI instructions — what should the AI do with the transcription?"
              value={newPrompt.promptText}
              onChange={e => setNewPrompt(p => ({ ...p, promptText: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y min-h-[100px] focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button size="sm" onClick={addCustomPrompt}
                disabled={!newPrompt.title.trim() || !newPrompt.promptText.trim()}>
                Add Prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full gap-2" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4" />
          Add Custom Prompt
        </Button>
      )}
    </div>
  )
}
