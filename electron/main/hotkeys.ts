import { globalShortcut } from 'electron'
import { getOverlayWindow, showOverlay, hideOverlay, isOverlayReady } from './windows'
import { getStore } from './store'

let isRecording = false
let isProcessing = false

export function getIsRecording(): boolean {
  return isRecording
}

export function setIsRecording(value: boolean) {
  isRecording = value
}

export function setIsProcessing(value: boolean) {
  isProcessing = value
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
      if (!overlay || overlay.isDestroyed()) return

      // Don't allow toggling while processing (STT/cleanup/injection in progress)
      if (isProcessing) return

      // Check overlay is loaded (settings + API key ready)
      if (!isOverlayReady()) {
        console.warn('[VoiceFlow] Overlay not ready yet, ignoring hotkey')
        return
      }

      if (!isRecording) {
        showOverlay()
        // Small delay to let overlay become visible before starting recording
        setTimeout(() => {
          overlay.webContents.send('start-recording')
        }, 100)
        isRecording = true
      } else {
        overlay.webContents.send('stop-recording')
        isRecording = false
        isProcessing = true // Prevent re-toggle during processing
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
    if (isRecording || isProcessing) {
      const overlay = getOverlayWindow()
      overlay?.webContents.send('cancel-recording')
      hideOverlay()
      isRecording = false
      isProcessing = false
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
