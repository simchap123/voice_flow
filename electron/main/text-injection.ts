import { clipboard } from 'electron'

export async function injectText(text: string): Promise<{ success: boolean; method: string }> {
  // Save current clipboard contents to restore later
  const previousClipboard = clipboard.readText()

  // Write transcribed text to clipboard
  clipboard.writeText(text)

  // Wait for clipboard to settle before pasting
  await new Promise(resolve => setTimeout(resolve, 50))

  try {
    const { keyboard, Key } = await import('@nut-tree-fork/nut-js')

    // Use Ctrl+V paste directly (keyboard.type() is unreliable across apps)
    const isMac = process.platform === 'darwin'
    if (isMac) {
      await keyboard.pressKey(Key.LeftSuper, Key.V)
      await keyboard.releaseKey(Key.LeftSuper, Key.V)
    } else {
      await keyboard.pressKey(Key.LeftControl, Key.V)
      await keyboard.releaseKey(Key.LeftControl, Key.V)
    }

    // Restore previous clipboard after a longer delay to ensure paste completes
    setTimeout(() => clipboard.writeText(previousClipboard), 1000)

    return { success: true, method: 'nut-js-paste' }
  } catch (error) {
    console.error('[VoiceFlow] nut-js injection failed, text is in clipboard:', error)
    // Fallback: text remains in clipboard, user can paste manually
    return { success: false, method: 'clipboard-only' }
  }
}
