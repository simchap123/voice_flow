import { useState, useRef } from 'react'

interface HotkeyRecorderProps {
  value: string
  onChange: (hotkey: string) => void
  placeholder?: string
  allowClear?: boolean
}

// Map standalone modifier keys (by e.key)
const MODIFIER_KEYS = new Set(['Alt', 'Control', 'Shift', 'Meta'])

// Map e.code to side-specific modifier names
const CODE_TO_MODIFIER: Record<string, string> = {
  'AltLeft': 'LeftAlt',
  'AltRight': 'RightAlt',
  'ControlLeft': 'LeftControl',
  'ControlRight': 'RightControl',
  'ShiftLeft': 'LeftShift',
  'ShiftRight': 'RightShift',
  'MetaLeft': 'Super',
  'MetaRight': 'Super',
}

// Fallback: generic modifier name (when code doesn't distinguish side)
const KEY_TO_MODIFIER: Record<string, string> = {
  'Alt': 'Alt',
  'Control': 'Control',
  'Shift': 'Shift',
  'Meta': 'Super',
}

const isWindows = navigator.userAgent.includes('Windows')

// Display-friendly names
const DISPLAY_NAMES: Record<string, string> = {
  'RightAlt': 'Right Alt',
  'LeftAlt': 'Left Alt',
  'RightControl': 'Right Ctrl',
  'LeftControl': 'Left Ctrl',
  'RightShift': 'Right Shift',
  'LeftShift': 'Left Shift',
  'Super': isWindows ? 'Windows' : 'Super',
}

function displayHotkey(hotkey: string): string {
  return DISPLAY_NAMES[hotkey] || hotkey
}

// Map browser key event to Electron accelerator format
function keyEventToAccelerator(e: KeyboardEvent): string | null {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Control')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Super')

  const key = e.key
  if (MODIFIER_KEYS.has(key)) return null

  const keyMap: Record<string, string> = {
    ' ': 'Space', 'ArrowUp': 'Up', 'ArrowDown': 'Down',
    'ArrowLeft': 'Left', 'ArrowRight': 'Right', 'Enter': 'Return',
    'Escape': 'Escape', 'Backspace': 'Backspace', 'Delete': 'Delete',
    'Tab': 'Tab', 'Home': 'Home', 'End': 'End',
    'PageUp': 'PageUp', 'PageDown': 'PageDown', 'Insert': 'Insert',
  }

  const mappedKey = keyMap[key] ?? (key.length === 1 ? key.toUpperCase() : key)
  parts.push(mappedKey)
  return parts.join('+')
}

function getHeldModifiersDisplay(mods: Set<string>): string {
  return Array.from(mods).join('+')
}

export function HotkeyRecorder({
  value,
  onChange,
  placeholder = 'Click to set',
  allowClear = false,
}: HotkeyRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [pendingKeys, setPendingKeys] = useState<string | null>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const heldModifiersRef = useRef<Set<string>>(new Set())
  const hadNonModifierRef = useRef(false)

  const startRecording = () => {
    setRecording(true)
    setPendingKeys(null)
    heldModifiersRef.current = new Set()
    hadNonModifierRef.current = false
    setTimeout(() => captureRef.current?.focus(), 50)
  }

  const finishRecording = (hotkey: string) => {
    onChange(hotkey)
    setRecording(false)
    setPendingKeys(null)
    heldModifiersRef.current = new Set()
    hadNonModifierRef.current = false
  }

  const cancelRecording = () => {
    setRecording(false)
    setPendingKeys(null)
    heldModifiersRef.current = new Set()
    hadNonModifierRef.current = false
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Escape cancels recording
    if (e.key === 'Escape') {
      cancelRecording()
      return
    }

    const key = e.key
    if (MODIFIER_KEYS.has(key)) {
      // Use e.code to distinguish left vs right (e.g., "AltLeft" vs "AltRight")
      const modName = CODE_TO_MODIFIER[e.nativeEvent.code] || KEY_TO_MODIFIER[key] || key
      heldModifiersRef.current.add(modName)
      setPendingKeys(
        Array.from(heldModifiersRef.current).map(m => displayHotkey(m)).join('+') + '+...'
      )
      return
    }

    hadNonModifierRef.current = true
    const accelerator = keyEventToAccelerator(e.nativeEvent)
    if (accelerator) {
      finishRecording(accelerator)
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    const key = e.key
    if (MODIFIER_KEYS.has(key)) {
      const modName = CODE_TO_MODIFIER[e.nativeEvent.code] || KEY_TO_MODIFIER[key] || key
      if (!hadNonModifierRef.current && heldModifiersRef.current.has(modName)) {
        finishRecording(modName)
        return
      }
      heldModifiersRef.current.delete(modName)
    }
  }

  const handleBlur = () => {
    if (recording) cancelRecording()
  }

  if (recording) {
    return (
      <div
        ref={captureRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={handleBlur}
        className="inline-flex items-center gap-1.5 rounded-md border-2 border-primary/50 bg-primary/5 px-3 py-1.5 text-[11px] font-medium outline-none animate-pulse cursor-text"
      >
        {pendingKeys ? displayHotkey(pendingKeys) : 'Press a key...'}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={startRecording}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/30 px-3 py-1.5 text-[11px] font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
      >
        {value ? (
          value.split('+').map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="text-muted-foreground/30 mx-0.5">+</span>}
              <kbd className="rounded-sm border border-border/50 bg-card px-1.5 py-0.5 text-[10px] font-bold">{displayHotkey(part)}</kbd>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground/50">{placeholder}</span>
        )}
      </button>
      {allowClear && value && (
        <button
          onClick={() => onChange('')}
          className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors text-[10px] px-1"
          title="Clear hotkey"
        >
          ×
        </button>
      )}
    </div>
  )
}
