import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { PREDEFINED_PROMPTS } from '@/lib/cleanup/predefined-prompts'
import type { CustomPrompt } from '@/types/custom-prompt'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/useToast'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

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

  function startEdit(prompt: CustomPrompt) {
    setEditingId(prompt.id)
    setEditDraft({ promptText: prompt.promptText, title: prompt.title, description: prompt.description, icon: prompt.icon })
  }

  async function saveEdit(prompt: CustomPrompt) {
    if (prompt.isPredefined) {
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
      id: window.crypto.randomUUID(),
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

  const allPrompts: CustomPrompt[] = [
    ...PREDEFINED_PROMPTS.map(p => {
      const override = userPrompts.find(u => u.id === p.id)
      return override ? { ...p, ...override, isPredefined: true } : p
    }),
    ...userPrompts.filter(p => !PREDEFINED_PROMPTS.some(pre => pre.id === p.id)),
  ]

  return (
    <div className="space-y-5">
      {/* Prompt list */}
      <div className="space-y-2.5">
        {allPrompts.map((prompt) => {
          const isActive = prompt.id === activeId
          const isEditing = editingId === prompt.id

          return (
            <div
              key={prompt.id}
              className={`glass-card-hover cursor-pointer overflow-hidden transition-all duration-150 ${
                isActive ? 'border-primary/30 bg-primary/5' : ''
              }`}
              onClick={() => !isEditing && selectPrompt(prompt.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg shrink-0">{editDraft.icon && isEditing ? editDraft.icon : prompt.icon}</span>
                  <div className="min-w-0">
                    {isEditing ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          value={editDraft.icon ?? prompt.icon}
                          onChange={e => setEditDraft(d => ({ ...d, icon: e.target.value }))}
                          className="w-14 text-[13px] text-center rounded-lg"
                          maxLength={2}
                          onClick={e => e.stopPropagation()}
                        />
                        <Input
                          value={editDraft.title ?? prompt.title}
                          onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))}
                          className="text-[13px] font-medium rounded-lg"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <p className="text-[13px] font-medium flex items-center gap-2">
                        {prompt.title}
                        {prompt.isPredefined && (
                          <span className="text-[9px] font-normal text-muted-foreground/50 border border-border/30 rounded-md px-1.5 py-px">
                            built-in
                          </span>
                        )}
                      </p>
                    )}
                    {!isEditing && prompt.description && (
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">{prompt.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isActive && !isEditing && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-md px-2 py-0.5">
                      Active
                    </span>
                  )}
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg"
                        onClick={e => { e.stopPropagation(); saveEdit(prompt) }}>
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg"
                        onClick={e => { e.stopPropagation(); setEditingId(null); setEditDraft({}) }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg"
                        onClick={e => { e.stopPropagation(); startEdit(prompt) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!prompt.isPredefined && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:text-destructive"
                          onClick={e => { e.stopPropagation(); deleteUserPrompt(prompt.id) }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-4 pb-4">
                {isEditing ? (
                  <textarea
                    value={editDraft.promptText ?? prompt.promptText}
                    onChange={e => setEditDraft(d => ({ ...d, promptText: e.target.value }))}
                    onClick={e => e.stopPropagation()}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-[12px] font-mono resize-y min-h-[120px] focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                ) : (
                  <p className="text-[11px] font-mono text-muted-foreground/50 line-clamp-3 whitespace-pre-line">
                    {prompt.promptText}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add custom prompt */}
      {showAddForm ? (
        <div className="glass-card overflow-hidden">
          <div className="border-b border-border/30 px-5 py-4">
            <h3 className="text-[13px] font-semibold">New Custom Prompt</h3>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex gap-2">
              <Input
                placeholder="Icon"
                value={newPrompt.icon}
                onChange={e => setNewPrompt(p => ({ ...p, icon: e.target.value }))}
                className="w-16 text-center text-[13px] rounded-xl"
                maxLength={2}
              />
              <Input
                placeholder="Title"
                value={newPrompt.title}
                onChange={e => setNewPrompt(p => ({ ...p, title: e.target.value }))}
                className="text-[13px] flex-1 rounded-xl"
              />
            </div>
            <Input
              placeholder="Description (optional)"
              value={newPrompt.description}
              onChange={e => setNewPrompt(p => ({ ...p, description: e.target.value }))}
              className="text-[13px] rounded-xl"
            />
            <textarea
              placeholder="AI instructions — what should the AI do with the transcription?"
              value={newPrompt.promptText}
              onChange={e => setNewPrompt(p => ({ ...p, promptText: e.target.value }))}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-[12px] font-mono resize-y min-h-[100px] focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button size="sm" className="rounded-xl" onClick={addCustomPrompt}
                disabled={!newPrompt.title.trim() || !newPrompt.promptText.trim()}>
                Add Prompt
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4" />
          Add Custom Prompt
        </Button>
      )}
    </div>
  )
}
