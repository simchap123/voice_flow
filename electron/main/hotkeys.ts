import { globalShortcut } from 'electron'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { getOverlayWindow, showOverlay, isOverlayReady, shrinkOverlay } from './windows'
import { getStore } from './store'
import { canUseApp } from './license'

let isRecording = false
let isProcessing = false
let processingTimeout: ReturnType<typeof setTimeout> | null = null
let recordingMode: 'hold' | 'toggle' | 'prompt' | null = null // Track which mode started recording
const PROCESSING_TIMEOUT_MS = 30_000 // Safety: reset isProcessing after 30s
let uiohookStarted = false
let uiohookKeydownHandler: ((e: any) => void) | null = null
let uiohookKeyupHandler: ((e: any) => void) | null = null

// Hold-mode state
let holdThresholdTimer: ReturnType<typeof setTimeout> | null = null
let holdModifierDown = false
let comboCancelled = false
const HOLD_THRESHOLD_MS = 350

// Double-tap state
const DOUBLE_TAP_WINDOW_MS = 300
let doubleTapLastKeyupTime = 0
let doubleTapCancelled = false

export function getIsRecording(): boolean {
  return isRecording
}

export function setIsRecording(value: boolean) {
  isRecording = value
  if (!value) recordingMode = null
}

export function setIsProcessing(value: boolean) {
  isProcessing = value

  // Clear any existing safety timeout
  if (processingTimeout) {
    clearTimeout(processingTimeout)
    processingTimeout = null
  }

  // When processing starts, set a safety timeout to auto-reset
  // This prevents the app from becoming permanently unresponsive
  if (value) {
    processingTimeout = setTimeout(() => {
      if (isProcessing) {
        console.warn('[VoxGen] Processing timeout reached (30s), resetting state')
        isProcessing = false
        isRecording = false
        recordingMode = null
      }
      processingTimeout = null
    }, PROCESSING_TIMEOUT_MS)
  }
}

// Map modifier names to uiohook key codes
const MODIFIER_KEYCODES: Record<string, number[]> = {
  'Alt': [UiohookKey.Alt, UiohookKey.AltRight],
  'Control': [UiohookKey.Ctrl, UiohookKey.CtrlRight],
  'Shift': [UiohookKey.Shift, UiohookKey.ShiftRight],
  'Super': [UiohookKey.Meta, UiohookKey.MetaRight],
  'Meta': [UiohookKey.Meta, UiohookKey.MetaRight],
}

// All modifier keycodes (flat list for combo detection)
const ALL_MODIFIER_KEYCODES = new Set(
  Object.values(MODIFIER_KEYCODES).flat()
)

// Check if a hotkey is a standalone modifier
function isStandaloneModifier(hotkey: string): boolean {
  return hotkey in MODIFIER_KEYCODES
}

// Suppress Windows Alt menu activation by injecting a synthetic Ctrl press/release
// while Alt is still held. This makes the OS see "Alt+Ctrl" (a combo) instead of
// a standalone Alt tap, preventing ribbon/menu activation in Outlook and other apps.
async function suppressAltMenu() {
  try {
    const { keyboard, Key } = await import('@nut-tree-fork/nut-js')
    await keyboard.pressKey(Key.LeftControl)
    await keyboard.releaseKey(Key.LeftControl)
  } catch (err) {
    console.warn('[VoxGen] Failed to suppress Alt menu:', err)
  }
}

// Core action handler for hold, toggle, and prompt modes
function handleHotkeyAction(mode: 'hold' | 'toggle' | 'prompt', action: 'start' | 'stop') {
  const overlay = getOverlayWindow()
  if (!overlay || overlay.isDestroyed()) return

  if (isProcessing) return

  if (!isOverlayReady()) {
    console.warn('[VoxGen] Overlay not ready yet, ignoring hotkey')
    return
  }

  if (action === 'start' && !isRecording) {
    // Check license/trial before allowing recording
    if (!canUseApp()) {
      showOverlay()
      setTimeout(() => {
        overlay.webContents.send('trial-expired')
      }, 100)
      console.log('[VoxGen] Recording blocked: trial expired and no active license')
      return
    }

    showOverlay()
    setTimeout(() => {
      overlay.webContents.send('start-recording', { mode })
    }, 100)
    isRecording = true
    recordingMode = mode
    console.log(`[VoxGen] Recording started (${mode} mode)`)
  } else if (action === 'stop' && isRecording && recordingMode === mode) {
    // Only the mode that started recording can stop it
    shrinkOverlay()
    overlay.webContents.send('stop-recording')
    isRecording = false
    setIsProcessing(true) // Use setter to get safety timeout
    recordingMode = null
    console.log(`[VoxGen] Recording stopped (${mode} mode)`)
  }
}

// Register hold-mode modifier key with 350ms threshold + combo detection
function registerHoldModifier(hotkey: string): { success: boolean; error?: string } {
  const keycodes = MODIFIER_KEYCODES[hotkey]
  if (!keycodes) {
    return { success: false, error: `Unknown modifier: "${hotkey}"` }
  }

  // The keydown handler starts the threshold timer; any non-modifier key cancels it
  const keydownHandler = (e: any) => {
    if (keycodes.includes(e.keycode)) {
      // Modifier pressed — start threshold timer
      if (!holdModifierDown && !isRecording && !isProcessing) {
        holdModifierDown = true
        comboCancelled = false

        holdThresholdTimer = setTimeout(() => {
          holdThresholdTimer = null
          if (holdModifierDown && !comboCancelled) {
            handleHotkeyAction('hold', 'start')
            // Prevent Alt from activating menus in Outlook and other ribbon apps
            if (hotkey === 'Alt') suppressAltMenu()
          }
        }, HOLD_THRESHOLD_MS)
      }
    } else {
      // Any other key was pressed (modifier or not, e.g., Shift in Alt+Shift, Tab in Alt+Tab)
      // Only cancel the threshold timer (before recording starts). Once recording has started,
      // the user must release the modifier to stop — stray keypresses should NOT cancel it.
      if (holdModifierDown && holdThresholdTimer) {
        clearTimeout(holdThresholdTimer)
        holdThresholdTimer = null
        comboCancelled = true
      }
    }
  }

  const keyupHandler = (e: any) => {
    if (keycodes.includes(e.keycode)) {
      holdModifierDown = false

      // Cancel threshold timer if released before threshold
      if (holdThresholdTimer) {
        clearTimeout(holdThresholdTimer)
        holdThresholdTimer = null
      }

      // Stop recording if currently recording
      if (isRecording) {
        handleHotkeyAction('hold', 'stop')
      }
    }
  }

  return { success: true, keydownHandler, keyupHandler } as any
}

// Register toggle-mode modifier key (press to start, press again to stop)
function registerToggleModifier(hotkey: string): { success: boolean; error?: string } {
  const keycodes = MODIFIER_KEYCODES[hotkey]
  if (!keycodes) {
    return { success: false, error: `Unknown modifier: "${hotkey}"` }
  }

  let modifierPressedAt = 0
  let modifierCancelled = false

  const keydownHandler = (e: any) => {
    if (keycodes.includes(e.keycode)) {
      if (modifierPressedAt === 0) {
        modifierPressedAt = Date.now()
        modifierCancelled = false
      }
    } else if (!ALL_MODIFIER_KEYCODES.has(e.keycode)) {
      // Non-modifier key = combo, cancel
      modifierCancelled = true
    }
  }

  const keyupHandler = (e: any) => {
    if (keycodes.includes(e.keycode)) {
      const held = Date.now() - modifierPressedAt
      modifierPressedAt = 0

      // Only toggle if it wasn't a combo and was a quick press (<500ms)
      if (!modifierCancelled && held < 500) {
        if (!isRecording && !isProcessing) {
          handleHotkeyAction('toggle', 'start')
        } else if (isRecording) {
          handleHotkeyAction('toggle', 'stop')
        }
      }
    }
  }

  return { success: true, keydownHandler, keyupHandler } as any
}

// Register double-tap modifier key (double-press to toggle recording on/off)
function registerDoubleTapModifier(hotkey: string): { success: boolean; error?: string } {
  const keycodes = MODIFIER_KEYCODES[hotkey]
  if (!keycodes) {
    return { success: false, error: `Unknown modifier: "${hotkey}"` }
  }

  const keydownHandler = (e: any) => {
    if (keycodes.includes(e.keycode)) {
      // Modifier pressed — nothing to do on down except track state
    } else if (!ALL_MODIFIER_KEYCODES.has(e.keycode)) {
      // A non-modifier key was pressed between taps — cancel double-tap detection
      doubleTapCancelled = true
    }
  }

  const keyupHandler = (e: any) => {
    if (keycodes.includes(e.keycode)) {
      const now = Date.now()

      if (doubleTapCancelled) {
        // Reset: a non-modifier key was pressed, so this isn't a clean double-tap
        doubleTapCancelled = false
        doubleTapLastKeyupTime = now
        return
      }

      if (now - doubleTapLastKeyupTime < DOUBLE_TAP_WINDOW_MS) {
        // Double-tap detected — toggle recording
        doubleTapLastKeyupTime = 0 // Reset to avoid triple-tap re-trigger
        if (!isRecording && !isProcessing) {
          handleHotkeyAction('toggle', 'start')
          if (hotkey === 'Alt') suppressAltMenu()
        } else if (isRecording) {
          handleHotkeyAction('toggle', 'stop')
        }
      } else {
        doubleTapLastKeyupTime = now
      }
    }
  }

  return { success: true, keydownHandler, keyupHandler } as any
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

  // Reset hold state
  if (holdThresholdTimer) {
    clearTimeout(holdThresholdTimer)
    holdThresholdTimer = null
  }
  holdModifierDown = false
  comboCancelled = false

  // Reset double-tap state
  doubleTapLastKeyupTime = 0
  doubleTapCancelled = false
}

export function registerHotkeys(): { success: boolean; error?: string } {
  const store = getStore()
  const holdHotkey = store?.get('holdHotkey', 'Alt') as string ?? 'Alt'
  const toggleHotkey = store?.get('toggleHotkey', '') as string ?? ''
  const promptHotkey = store?.get('promptHotkey', '') as string ?? ''
  const doubleTapHotkey = store?.get('doubleTapHotkey', '') as string ?? ''

  if (!holdHotkey && !toggleHotkey && !doubleTapHotkey) {
    return { success: false, error: 'No hotkeys configured.' }
  }

  // Clean up everything first
  cleanupUiohook()

  // Collect uiohook handlers from both registrations
  const keydownHandlers: ((e: any) => void)[] = []
  const keyupHandlers: ((e: any) => void)[] = []

  // Register hold hotkey
  if (holdHotkey) {
    if (isStandaloneModifier(holdHotkey)) {
      const result = registerHoldModifier(holdHotkey) as any
      if (!result.success) return result
      keydownHandlers.push(result.keydownHandler)
      keyupHandlers.push(result.keyupHandler)
    } else {
      // Regular key/combo for hold mode — use globalShortcut
      // Hold mode with globalShortcut: press starts, press again stops
      try {
        const registered = globalShortcut.register(holdHotkey, () => {
          if (!isRecording && !isProcessing) {
            handleHotkeyAction('hold', 'start')
          } else if (isRecording) {
            handleHotkeyAction('hold', 'stop')
          }
        })
        if (!registered) {
          return { success: false, error: `"${holdHotkey}" is already in use by another application.` }
        }
      } catch (err: any) {
        return { success: false, error: `Failed to register "${holdHotkey}": ${err.message}` }
      }
    }
  }

  // Register toggle hotkey
  if (toggleHotkey) {
    if (isStandaloneModifier(toggleHotkey)) {
      const result = registerToggleModifier(toggleHotkey) as any
      if (!result.success) return result
      keydownHandlers.push(result.keydownHandler)
      keyupHandlers.push(result.keyupHandler)
    } else {
      // Regular key/combo for toggle mode — use globalShortcut
      try {
        const registered = globalShortcut.register(toggleHotkey, () => {
          console.log(`[VoxGen] Toggle hotkey pressed: isRecording=${isRecording}, isProcessing=${isProcessing}, recordingMode=${recordingMode}`)
          if (!isRecording && !isProcessing) {
            handleHotkeyAction('toggle', 'start')
          } else if (isRecording) {
            handleHotkeyAction('toggle', 'stop')
          }
        })
        if (!registered) {
          return { success: false, error: `"${toggleHotkey}" is already in use by another application.` }
        }
      } catch (err: any) {
        return { success: false, error: `Failed to register "${toggleHotkey}": ${err.message}` }
      }
    }
  }

  // Register prompt hotkey (toggle behavior: press to start, press to stop — uses 'prompt' mode)
  if (promptHotkey) {
    try {
      const registered = globalShortcut.register(promptHotkey, () => {
        console.log(`[VoxGen] Prompt hotkey pressed: isRecording=${isRecording}, isProcessing=${isProcessing}, recordingMode=${recordingMode}`)
        if (!isRecording && !isProcessing) {
          handleHotkeyAction('prompt', 'start')
        } else if (isRecording && recordingMode === 'prompt') {
          handleHotkeyAction('prompt', 'stop')
        }
      })
      if (!registered) {
        console.warn(`[VoxGen] Prompt hotkey "${promptHotkey}" already in use`)
      }
    } catch (err: any) {
      console.warn(`[VoxGen] Failed to register prompt hotkey "${promptHotkey}": ${err.message}`)
    }
  }

  // Register double-tap hotkey (modifier-only: double-press to toggle recording)
  if (doubleTapHotkey) {
    if (isStandaloneModifier(doubleTapHotkey)) {
      const result = registerDoubleTapModifier(doubleTapHotkey) as any
      if (!result.success) return result
      keydownHandlers.push(result.keydownHandler)
      keyupHandlers.push(result.keyupHandler)
    } else {
      console.warn(`[VoxGen] Double-tap hotkey "${doubleTapHotkey}" is not a modifier key, ignoring`)
    }
  }

  // Install combined uiohook handlers if any modifier-based hotkeys
  if (keydownHandlers.length > 0 || keyupHandlers.length > 0) {
    uiohookKeydownHandler = (e: any) => {
      for (const handler of keydownHandlers) handler(e)
    }
    uiohookKeyupHandler = (e: any) => {
      for (const handler of keyupHandlers) handler(e)
    }

    uIOhook.on('keydown', uiohookKeydownHandler)
    uIOhook.on('keyup', uiohookKeyupHandler)

    if (!uiohookStarted) {
      uIOhook.start()
      uiohookStarted = true
    }
  }

  // Cancel recording with Escape
  try {
    globalShortcut.register('Escape', () => {
      if (isRecording || isProcessing) {
        const overlay = getOverlayWindow()
        overlay?.webContents.send('cancel-recording')
        isRecording = false
        isProcessing = false
        recordingMode = null
      }
    })
  } catch {
    console.warn('[VoxGen] Could not register Escape key (may be in use)')
  }

  const parts: string[] = []
  if (holdHotkey) parts.push(`hold: ${holdHotkey}`)
  if (toggleHotkey) parts.push(`toggle: ${toggleHotkey}`)
  if (promptHotkey) parts.push(`prompt: ${promptHotkey}`)
  if (doubleTapHotkey) parts.push(`double-tap: ${doubleTapHotkey}`)
  console.log(`[VoxGen] Hotkeys registered: ${parts.join(', ')}`)
  return { success: true }
}

export function unregisterAllHotkeys() {
  globalShortcut.unregisterAll()
  cleanupUiohook()
}

export function reregisterHotkeys(): { success: boolean; error?: string } {
  unregisterAllHotkeys()
  return registerHotkeys()
}
