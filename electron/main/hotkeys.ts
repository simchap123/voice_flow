import { globalShortcut } from 'electron'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { getOverlayWindow, showOverlay, hideOverlay, isOverlayReady } from './windows'
import { getStore } from './store'

let isRecording = false
let isProcessing = false
let uiohookStarted = false
let uiohookKeydownHandler: ((e: any) => void) | null = null
let uiohookKeyupHandler: ((e: any) => void) | null = null

export function getIsRecording(): boolean {
  return isRecording
}

export function setIsRecording(value: boolean) {
  isRecording = value
}

export function setIsProcessing(value: boolean) {
  isProcessing = value
}

// Map modifier names to uiohook key codes
const MODIFIER_KEYCODES: Record<string, number[]> = {
  'Alt': [UiohookKey.Alt, UiohookKey.AltRight],
  'Control': [UiohookKey.Ctrl, UiohookKey.CtrlRight],
  'Shift': [UiohookKey.Shift, UiohookKey.ShiftRight],
  'Super': [UiohookKey.Meta, UiohookKey.MetaRight],
  'Meta': [UiohookKey.Meta, UiohookKey.MetaRight],
}

// Check if a hotkey is a standalone modifier
function isStandaloneModifier(hotkey: string): boolean {
  return hotkey in MODIFIER_KEYCODES
}

// Core toggle logic shared by both globalShortcut and uiohook
function handleHotkeyToggle() {
  const overlay = getOverlayWindow()
  if (!overlay || overlay.isDestroyed()) return

  if (isProcessing) return

  if (!isOverlayReady()) {
    console.warn('[VoiceFlow] Overlay not ready yet, ignoring hotkey')
    return
  }

  if (!isRecording) {
    showOverlay()
    setTimeout(() => {
      overlay.webContents.send('start-recording')
    }, 100)
    isRecording = true
  } else {
    overlay.webContents.send('stop-recording')
    isRecording = false
    isProcessing = true
  }
}

// Register a standalone modifier key using uiohook-napi
function registerModifierHotkey(hotkey: string): { success: boolean; error?: string } {
  const keycodes = MODIFIER_KEYCODES[hotkey]
  if (!keycodes) {
    return { success: false, error: `Unknown modifier: "${hotkey}"` }
  }

  // Clean up old handlers
  cleanupUiohook()

  uiohookKeydownHandler = (e: any) => {
    if (keycodes.includes(e.keycode)) {
      // Only trigger on first press (not auto-repeat)
      if (!isRecording && !isProcessing) {
        handleHotkeyToggle()
      }
    }
  }

  uiohookKeyupHandler = (e: any) => {
    if (keycodes.includes(e.keycode)) {
      if (isRecording) {
        handleHotkeyToggle()
      }
    }
  }

  uIOhook.on('keydown', uiohookKeydownHandler)
  uIOhook.on('keyup', uiohookKeyupHandler)

  if (!uiohookStarted) {
    uIOhook.start()
    uiohookStarted = true
  }

  return { success: true }
}

function cleanupUiohook() {
  if (uiohookKeydownHandler) {
    uIOhook.off('keydown', uiohookKeydownHandler)
    uiohookKeydownHandler = null
  }
  if (uiohookKeyupHandler) {
    uIOhook.off('keyup', uiohookKeyupHandler)
    uiohookKeyupHandler = null
  }
}

export function registerHotkeys(): { success: boolean; error?: string } {
  const store = getStore()
  const hotkey = store?.get('hotkey', 'Alt') as string ?? 'Alt'
  const hotkeyMode = store?.get('hotkeyMode', 'hold') as string ?? 'hold'

  if (!hotkey) {
    return { success: false, error: 'No hotkey configured.' }
  }

  let result: { success: boolean; error?: string }

  if (isStandaloneModifier(hotkey)) {
    // Use uiohook for standalone modifier keys (Alt, Ctrl, Shift, etc.)
    result = registerModifierHotkey(hotkey)
  } else {
    // Use Electron globalShortcut for regular keys and combos
    let registered = false
    try {
      registered = globalShortcut.register(hotkey, handleHotkeyToggle)
    } catch (err: any) {
      console.error('[VoiceFlow] Failed to register hotkey:', err)
      return { success: false, error: `Failed to register "${hotkey}": ${err.message}` }
    }

    if (!registered) {
      console.error('[VoiceFlow] Hotkey registration returned false:', hotkey)
      return { success: false, error: `"${hotkey}" is already in use by another application.` }
    }

    result = { success: true }
  }

  // Cancel recording with Escape
  try {
    globalShortcut.register('Escape', () => {
      if (isRecording || isProcessing) {
        const overlay = getOverlayWindow()
        overlay?.webContents.send('cancel-recording')
        hideOverlay()
        isRecording = false
        isProcessing = false
      }
    })
  } catch {
    console.warn('[VoiceFlow] Could not register Escape key (may be in use)')
  }

  console.log(`[VoiceFlow] Hotkey registered: ${hotkey} (mode: ${hotkeyMode}, uiohook: ${isStandaloneModifier(hotkey)})`)
  return result
}

export function unregisterAllHotkeys() {
  globalShortcut.unregisterAll()
  cleanupUiohook()
}

export function reregisterHotkeys(): { success: boolean; error?: string } {
  unregisterAllHotkeys()
  return registerHotkeys()
}
