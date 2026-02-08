import { useState, useRef } from 'react'
import { Keyboard, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface HotkeyRecorderProps {
  value: string
  onChange: (hotkey: string) => void
}

// Map standalone modifier keys
const MODIFIER_MAP: Record<string, string> = {
  'Alt': 'Alt',
  'Control': 'Control',
  'Shift': 'Shift',
  'Meta': 'Super',
}

// Map browser key event to Electron accelerator format
function keyEventToAccelerator(e: KeyboardEvent): string | null {
  const parts: string[] = []

  if (e.ctrlKey) parts.push('Control')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Super')

  const key = e.key

  // If it's a standalone modifier, don't add it again as the key part
  if (key in MODIFIER_MAP) return null

  // Map special keys to Electron accelerator names
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right',
    'Enter': 'Return',
    'Escape': 'Escape',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'Tab': 'Tab',
    'Home': 'Home',
    'End': 'End',
    'PageUp': 'PageUp',
    'PageDown': 'PageDown',
    'Insert': 'Insert',
  }

  const mappedKey = keyMap[key] ?? (key.length === 1 ? key.toUpperCase() : key)
  parts.push(mappedKey)

  return parts.join('+')
}

export function HotkeyRecorder({ value, onChange }: HotkeyRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [pendingKeys, setPendingKeys] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<string | null>(null)
  // Track if a modifier was pressed alone (no other key)
  const modifierOnlyRef = useRef<string | null>(null)

  const startRecording = () => {
    setRecording(true)
    setPendingKeys(null)
    pendingRef.current = null
    modifierOnlyRef.current = null
    setTimeout(() => captureRef.current?.focus(), 50)
  }

  const cancelRecording = () => {
    setRecording(false)
    setPendingKeys(null)
    pendingRef.current = null
    modifierOnlyRef.current = null
  }

  const finishRecording = (hotkey: string) => {
    onChange(hotkey)
    setRecording(false)
    setPendingKeys(null)
    pendingRef.current = null
    modifierOnlyRef.current = null
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const key = e.key

    // Track standalone modifier press
    if (key in MODIFIER_MAP) {
      modifierOnlyRef.current = MODIFIER_MAP[key]
      setPendingKeys(MODIFIER_MAP[key])
      return
    }

    // A non-modifier key was pressed, clear standalone modifier tracking
    modifierOnlyRef.current = null

    const accelerator = keyEventToAccelerator(e.nativeEvent)
    if (accelerator) {
      setPendingKeys(accelerator)
      pendingRef.current = accelerator
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    const key = e.key

    // If a standalone modifier was released without any other key
    if (key in MODIFIER_MAP && modifierOnlyRef.current) {
      finishRecording(modifierOnlyRef.current)
      return
    }

    // Regular key released
    const current = pendingRef.current
    if (current) {
      finishRecording(current)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Keyboard className="h-4 w-4" />
        Global Hotkey
      </Label>
      <p className="text-xs text-muted-foreground">
        Press any key or modifier (Alt, Ctrl, Shift) to toggle recording
      </p>

      {recording ? (
        <div className="flex gap-2 items-center">
          <div
            ref={captureRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            className="flex h-10 flex-1 items-center rounded-md border border-primary/50 bg-primary/5 px-3 text-sm font-mono outline-none ring-2 ring-primary/20 animate-pulse"
          >
            {pendingKeys ?? 'Press any key...'}
          </div>
          <Button variant="outline" size="sm" onClick={cancelRecording}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          <div className="flex h-10 flex-1 items-center rounded-md border border-input bg-background px-3 text-sm font-mono">
            {value}
          </div>
          <Button variant="outline" size="sm" onClick={startRecording} className="gap-1.5 shrink-0">
            {saved ? <Check className="h-3 w-3 text-green-500" /> : <Keyboard className="h-3 w-3" />}
            {saved ? 'Saved' : 'Change'}
          </Button>
        </div>
      )}
    </div>
  )
}
