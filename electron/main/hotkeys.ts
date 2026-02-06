import { globalShortcut } from 'electron'
import { getOverlayWindow, showOverlay, hideOverlay } from './windows'
import { getStore } from './store'

let isRecording = false

export function getIsRecording(): boolean {
  return isRecording
}

export function setIsRecording(value: boolean) {
  isRecording = value
}

export function registerHotkeys(): { success: boolean; error?: string } {
  const store = getStore()
  const hotkey = store?.get('hotkey', 'Alt+Space') as string ?? 'Alt+Space'

  // Validate hotkey format (must contain modifier + key)
  const parts = hotkey.split('+')
  if (parts.length < 2) {
    console.error('[VoiceFlow] Invalid hotkey format:', hotkey)
    return { success: false, error: `Invalid hotkey format: "${hotkey}". Must be modifier+key (e.g., Alt+Space).` }
  }

  // Register toggle recording hotkey
  let registered = false
  try {
    registered = globalShortcut.register(hotkey, () => {
      const overlay = getOverlayWindow()
      if (!overlay) return

      if (!isRecording) {
        showOverlay()
        overlay.webContents.send('start-recording')
        isRecording = true
      } else {
        overlay.webContents.send('stop-recording')
        isRecording = false
      }
    })
  } catch (err: any) {
    console.error('[VoiceFlow] Failed to register hotkey:', err)
    return { success: false, error: `Failed to register "${hotkey}": ${err.message}` }
  }

  if (!registered) {
    console.error('[VoiceFlow] Hotkey registration returned false:', hotkey)
    return { success: false, error: `"${hotkey}" is already in use by another application.` }
  }

  // Cancel recording with Escape
  globalShortcut.register('Escape', () => {
    if (isRecording) {
      const overlay = getOverlayWindow()
      overlay?.webContents.send('cancel-recording')
      hideOverlay()
      isRecording = false
    }
  })

  console.log('[VoiceFlow] Hotkey registered:', hotkey)
  return { success: true }
}

export function unregisterAllHotkeys() {
  globalShortcut.unregisterAll()
}

export function reregisterHotkeys(): { success: boolean; error?: string } {
  unregisterAllHotkeys()
  return registerHotkeys()
}
