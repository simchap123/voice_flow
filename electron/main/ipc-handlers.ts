import { ipcMain, BrowserWindow } from 'electron'
import { hideOverlay, getMainWindow, getOverlayWindow } from './windows'
import { injectText } from './text-injection'
import { setIsRecording, setIsProcessing } from './hotkeys'
import { reregisterHotkeys } from './hotkeys'
import {
  saveApiKey,
  getApiKey,
  hasApiKey,
  getAllSettings,
  setSetting,
  getHistory,
  setHistory,
  getSnippets,
  setSnippets,
  getLicenseInfo,
  clearLicense,
} from './store'
import { validateLicenseKey } from './license'

export function registerIpcHandlers() {
  // Window controls
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  // Text injection
  ipcMain.handle('inject-text', async (_event, text: string) => {
    console.log('[VoiceFlow] inject-text IPC received, text length:', text?.length)
    hideOverlay(true) // instant hide
    setIsRecording(false)
    setIsProcessing(false)

    // Small delay to let overlay fully hide, then paste into focused app
    await new Promise(resolve => setTimeout(resolve, 150))
    const result = await injectText(text)
    console.log('[VoiceFlow] inject-text result:', result)
    return result
  })

  // Hide overlay
  ipcMain.on('hide-overlay', () => {
    hideOverlay()
    setIsRecording(false)
    setIsProcessing(false)
  })

  // Notify main window of transcription results + save to history
  ipcMain.on('transcription-complete', (_event, data) => {
    // Save to history directly in the store (overlay recordings)
    const history = getHistory()
    const entry = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }
    setHistory([entry, ...history])
    console.log('[VoiceFlow] Saved transcription to history:', entry.cleanedText?.slice(0, 50))

    // Also forward to main window for live UI updates
    const mainWin = getMainWindow()
    mainWin?.webContents.send('transcription-complete', data)
  })

  // API Key management — multi-provider support
  ipcMain.handle('api-key:save', async (_event, key: string, provider: string = 'openai') => {
    console.log(`[VoiceFlow] IPC api-key:save for ${provider}, key length:`, key?.length)
    const result = saveApiKey(key, provider)
    console.log(`[VoiceFlow] IPC api-key:save result:`, result)
    return result
  })

  ipcMain.handle('api-key:get', async (_event, provider: string = 'openai') => {
    const key = getApiKey(provider)
    console.log(`[VoiceFlow] IPC api-key:get for ${provider}, has key:`, !!key)
    return key
  })

  ipcMain.handle('api-key:has', async (_event, provider: string = 'openai') => {
    const has = hasApiKey(provider)
    console.log(`[VoiceFlow] IPC api-key:has for ${provider}:`, has)
    return has
  })

  // Settings
  ipcMain.handle('settings:get-all', async () => {
    return getAllSettings()
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: any) => {
    setSetting(key as any, value)
    if (key === 'holdHotkey' || key === 'toggleHotkey') {
      const result = reregisterHotkeys()
      return result
    }
    return { success: true }
  })

  // History
  ipcMain.handle('history:get', async () => {
    return getHistory()
  })

  ipcMain.handle('history:set', async (_event, history: any[]) => {
    setHistory(history)
  })

  // Snippets
  ipcMain.handle('snippets:get', async () => {
    return getSnippets()
  })

  ipcMain.handle('snippets:set', async (_event, snippets: any[]) => {
    setSnippets(snippets)
  })

  // License
  ipcMain.handle('license:validate', async (_event, key: string) => {
    console.log('[VoiceFlow] IPC license:validate, key length:', key?.length)
    const result = await validateLicenseKey(key)
    console.log('[VoiceFlow] IPC license:validate result:', result.valid, result.plan)
    return result
  })

  ipcMain.handle('license:get-info', async () => {
    return getLicenseInfo()
  })

  ipcMain.handle('license:clear', async () => {
    clearLicense()
    console.log('[VoiceFlow] License cleared')
  })
}
