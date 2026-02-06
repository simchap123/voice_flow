import { useState, useCallback, useRef } from 'react'
import { Keyboard, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface HotkeyRecorderProps {
  value: string
  onChange: (hotkey: string) => void
}

// Map browser key event to Electron accelerator format
function keyEventToAccelerator(e: React.KeyboardEvent): string | null {
  const parts: string[] = []

  if (e.ctrlKey) parts.push('Control')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Super')

  // Ignore standalone modifier presses
  const key = e.key
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return null

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

  // Require at least one modifier
  if (parts.length < 2) return null

  return parts.join('+')
}

export function HotkeyRecorder({ value, onChange }: HotkeyRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [pendingKeys, setPendingKeys] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const accelerator = keyEventToAccelerator(e)
    if (accelerator) {
      setPendingKeys(accelerator)
    }
  }, [])

  const handleKeyUp = useCallback(() => {
    if (pendingKeys) {
      onChange(pendingKeys)
      setRecording(false)
      setPendingKeys(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }, [pendingKeys, onChange])

  const startRecording = () => {
    setRecording(true)
    setPendingKeys(null)
    // Focus the capture area
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const cancelRecording = () => {
    setRecording(false)
    setPendingKeys(null)
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Keyboard className="h-4 w-4" />
        Global Hotkey
      </Label>
      <p className="text-xs text-muted-foreground">
        Keyboard shortcut to toggle recording from any app
      </p>

      {recording ? (
        <div className="flex gap-2">
          <div
            ref={inputRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onBlur={cancelRecording}
            className="flex h-10 flex-1 items-center rounded-md border border-primary/50 bg-primary/5 px-3 text-sm font-mono outline-none ring-2 ring-primary/20 animate-pulse"
          >
            {pendingKeys ?? 'Press a key combination...'}
          </div>
          <Button variant="outline" size="sm" onClick={cancelRecording}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex h-10 flex-1 items-center rounded-md border border-input bg-background px-3 text-sm font-mono">
            {value}
          </div>
          <Button variant="outline" size="sm" onClick={startRecording} className="gap-1.5">
            {saved ? <Check className="h-3 w-3 text-green-500" /> : <Keyboard className="h-3 w-3" />}
            {saved ? 'Saved' : 'Change'}
          </Button>
        </div>
      )}
    </div>
  )
}
