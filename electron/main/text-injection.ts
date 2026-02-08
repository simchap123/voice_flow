import { clipboard } from 'electron'

export async function injectText(text: string): Promise<{ success: boolean; method: string }> {
  // Save current clipboard contents to restore later
  const previousClipboard = clipboard.readText()

  // Write transcribed text to clipboard
  clipboard.writeText(text)

  try {
    const { keyboard, Key } = await import('@nut-tree-fork/nut-js')

    // Small delay to ensure focus has returned to the previous app
    await new Promise(resolve => setTimeout(resolve, 150))

    // Detect platform and use correct paste shortcut
    const isMac = process.platform === 'darwin'
    if (isMac) {
      await keyboard.pressKey(Key.LeftSuper, Key.V)
      await keyboard.releaseKey(Key.LeftSuper, Key.V)
    } else {
      await keyboard.pressKey(Key.LeftControl, Key.V)
      await keyboard.releaseKey(Key.LeftControl, Key.V)
    }

    // Restore previous clipboard after a short delay
    setTimeout(() => {
      clipboard.writeText(previousClipboard)
    }, 500)

    return { success: true, method: 'nut-js' }
  } catch (error) {
    console.error('[VoiceFlow] nut-js paste failed, text is in clipboard:', error)
    // Fallback: text remains in clipboard, user can paste manually
    return { success: false, method: 'clipboard-only' }
  }
}
