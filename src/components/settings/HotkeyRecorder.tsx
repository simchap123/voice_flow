import { useState, useRef } from 'react'
import { Keyboard, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface HotkeyRecorderProps {
  value: string
  onChange: (hotkey: string) => void
  label?: string
  description?: string
  allowClear?: boolean
}

// Map standalone modifier keys
const MODIFIER_MAP: Record<string, string> = {
  'Alt': 'Alt',
  'Control': 'Control',
  'Shift': 'Shift',
  'Meta': 'Super',
}

const isWindows = navigator.userAgent.includes('Windows')

// Display-friendly name for saved hotkey values
function displayHotkey(hotkey: string): string {
  if (!isWindows) return hotkey
  // Replace "Super" with "Windows" for display on Windows
  return hotkey.replace(/\bSuper\b/g, 'Windows')
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

// Build display string for currently held modifiers
function getHeldModifiersDisplay(mods: Set<string>): string {
  return Array.from(mods).join('+')
}

export function HotkeyRecorder({
  value,
  onChange,
  label = 'Global Hotkey',
  description = `Press a key combo (e.g. Alt+J) or hold a single modifier (Alt, Ctrl, Shift${isWindows ? ', Windows' : ''})`,
  allowClear = false,
}: HotkeyRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [pendingKeys, setPendingKeys] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<string | null>(null)
  // Track held modifiers for combo detection
  const heldModifiersRef = useRef<Set<string>>(new Set())
  // Track if any non-modifier key was pressed (means user wants a combo)
  const hadNonModifierRef = useRef(false)

  const startRecording = () => {
    setRecording(true)
    setPendingKeys(null)
    pendingRef.current = null
    heldModifiersRef.current = new Set()
    hadNonModifierRef.current = false
    setTimeout(() => captureRef.current?.focus(), 50)
  }

  const cancelRecording = () => {
    setRecording(false)
    setPendingKeys(null)
    pendingRef.current = null
    heldModifiersRef.current = new Set()
    hadNonModifierRef.current = false
  }

  const finishRecording = (hotkey: string) => {
    onChange(hotkey)
    setRecording(false)
    setPendingKeys(null)
    pendingRef.current = null
    heldModifiersRef.current = new Set()
    hadNonModifierRef.current = false
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    onChange('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const key = e.key

    // Track modifier key press
    if (key in MODIFIER_MAP) {
      heldModifiersRef.current.add(MODIFIER_MAP[key])
      // Show held modifiers as pending (user can still add a key)
      setPendingKeys(getHeldModifiersDisplay(heldModifiersRef.current) + '+...')
      return
    }

    // A non-modifier key was pressed — build the full combo
    hadNonModifierRef.current = true

    const accelerator = keyEventToAccelerator(e.nativeEvent)
    if (accelerator) {
      setPendingKeys(accelerator)
      pendingRef.current = accelerator
      // Immediately save combo keys (modifier+key)
      finishRecording(accelerator)
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    const key = e.key

    // If a modifier was released
    if (key in MODIFIER_MAP) {
      const modName = MODIFIER_MAP[key]

      // If no non-modifier key was pressed, this was a standalone modifier
      if (!hadNonModifierRef.current && heldModifiersRef.current.has(modName)) {
        // Save as standalone modifier (e.g. just "Alt")
        finishRecording(modName)
        return
      }

      heldModifiersRef.current.delete(modName)
      return
    }

    // Regular key released — combo should already be saved in keyDown
    const current = pendingRef.current
    if (current) {
      finishRecording(current)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Keyboard className="h-4 w-4" />
        {label}
      </Label>
      <p className="text-xs text-muted-foreground">
        {description}
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
            {pendingKeys ? displayHotkey(pendingKeys) : 'Press any key...'}
          </div>
          <Button variant="outline" size="sm" onClick={cancelRecording}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          <div className="flex h-10 flex-1 items-center rounded-md border border-input bg-background px-3 text-sm font-mono">
            {value ? displayHotkey(value) : <span className="text-muted-foreground">Not set</span>}
          </div>
          <Button variant="outline" size="sm" onClick={startRecording} className="gap-1.5 shrink-0">
            {saved ? <Check className="h-3 w-3 text-green-500" /> : <Keyboard className="h-3 w-3" />}
            {saved ? 'Saved' : 'Change'}
          </Button>
          {allowClear && value && (
            <Button variant="outline" size="sm" onClick={handleClear} className="gap-1.5 shrink-0">
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
