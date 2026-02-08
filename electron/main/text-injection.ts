import { clipboard } from 'electron'

export async function injectText(text: string): Promise<{ success: boolean; method: string }> {
  // Save current clipboard contents to restore later
  const previousClipboard = clipboard.readText()

  // Write transcribed text to clipboard
  clipboard.writeText(text)

  try {
    const { keyboard, Key } = await import('@nut-tree-fork/nut-js')

    // Use keyboard.type() to type text directly (works in terminals too)
    // Falls back to Ctrl+V paste if typing fails
    try {
      await keyboard.type(text)
      // Restore clipboard
      setTimeout(() => clipboard.writeText(previousClipboard), 500)
      return { success: true, method: 'nut-js-type' }
    } catch {
      console.log('[VoiceFlow] keyboard.type() failed, falling back to Ctrl+V')
    }

    // Fallback: Ctrl+V paste
    const isMac = process.platform === 'darwin'
    if (isMac) {
      await keyboard.pressKey(Key.LeftSuper, Key.V)
      await keyboard.releaseKey(Key.LeftSuper, Key.V)
    } else {
      await keyboard.pressKey(Key.LeftControl, Key.V)
      await keyboard.releaseKey(Key.LeftControl, Key.V)
    }

    // Restore previous clipboard after a short delay
    setTimeout(() => clipboard.writeText(previousClipboard), 500)

    return { success: true, method: 'nut-js-paste' }
  } catch (error) {
    console.error('[VoiceFlow] nut-js injection failed, text is in clipboard:', error)
    // Fallback: text remains in clipboard, user can paste manually
    return { success: false, method: 'clipboard-only' }
  }
}
