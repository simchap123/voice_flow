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

export function registerHotkeys() {
  const store = getStore()
  const hotkey = store?.get('hotkey', 'Alt+Space') as string ?? 'Alt+Space'

  // Toggle recording hotkey
  globalShortcut.register(hotkey, () => {
    const overlay = getOverlayWindow()
    if (!overlay) return

    if (!isRecording) {
      showOverlay()
      overlay.webContents.send('start-recording')
      isRecording = true
    } else {
      overlay.webContents.send('stop-recording')
      isRecording = false
      // Overlay hides after processing completes (via IPC)
    }
  })

  // Cancel recording with Escape
  globalShortcut.register('Escape', () => {
    if (isRecording) {
      const overlay = getOverlayWindow()
      overlay?.webContents.send('cancel-recording')
      hideOverlay()
      isRecording = false
    }
  })
}

export function unregisterAllHotkeys() {
  globalShortcut.unregisterAll()
}

export function reregisterHotkeys() {
  unregisterAllHotkeys()
  registerHotkeys()
}
