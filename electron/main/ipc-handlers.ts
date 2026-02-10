import { ipcMain, BrowserWindow, clipboard, app, shell, dialog } from 'electron'
import { copyFile } from 'node:fs/promises'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { hideOverlay, getMainWindow, getOverlayWindow, expandOverlay, expandOverlayIdle, shrinkOverlay } from './windows'
import { injectText } from './text-injection'
import { setIsRecording, setIsProcessing } from './hotkeys'
import { reregisterHotkeys } from './hotkeys'
import {
  saveApiKey,
  getApiKey,
  hasApiKey,
  deleteApiKey,
  getAllSettings,
  setSetting,
  getHistory,
  setHistory,
  getSnippets,
  setSnippets,
  getLicenseInfo,
  clearLicense,
} from './store'
import { validateLicenseKey, validateByEmail } from './license'
import { checkForUpdates, installUpdate } from './updater'
import { trackUsage } from './usage-tracker'

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
    console.log('[VoxGen] inject-text IPC received, text length:', text?.length)
    hideOverlay(true) // instant hide
    setIsRecording(false)
    setIsProcessing(false)

    // Small delay to let overlay fully hide, then paste into focused app
    await new Promise(resolve => setTimeout(resolve, 150))
    const result = await injectText(text)
    console.log('[VoxGen] inject-text result:', result)
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
    console.log('[VoxGen] Saved transcription to history:', entry.cleanedText?.slice(0, 50))

    // Fire-and-forget usage tracking (don't block the user)
    trackUsage(data).catch(() => {})

    // Also forward to main window for live UI updates
    const mainWin = getMainWindow()
    mainWin?.webContents.send('transcription-complete', data)
  })

  // API Key management — multi-provider support
  ipcMain.handle('api-key:save', async (_event, key: string, provider: string = 'openai') => {
    console.log(`[VoxGen] IPC api-key:save for ${provider}, key length:`, key?.length)
    const result = saveApiKey(key, provider)
    console.log(`[VoxGen] IPC api-key:save result:`, result)
    return result
  })

  ipcMain.handle('api-key:get', async (_event, provider: string = 'openai') => {
    const key = getApiKey(provider)
    console.log(`[VoxGen] IPC api-key:get for ${provider}, has key:`, !!key)
    return key
  })

  ipcMain.handle('api-key:has', async (_event, provider: string = 'openai') => {
    const has = hasApiKey(provider)
    console.log(`[VoxGen] IPC api-key:has for ${provider}:`, has)
    return has
  })

  ipcMain.handle('api-key:delete', async (_event, provider: string = 'openai') => {
    console.log(`[VoxGen] IPC api-key:delete for ${provider}`)
    return deleteApiKey(provider)
  })

  // Settings
  ipcMain.handle('settings:get-all', async () => {
    return getAllSettings()
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: any) => {
    setSetting(key as any, value)
    if (key === 'holdHotkey' || key === 'toggleHotkey' || key === 'promptHotkey') {
      const result = reregisterHotkeys()
      return result
    }
    // Broadcast setting change to all windows (keeps overlay in sync)
    const overlay = getOverlayWindow()
    if (overlay && !overlay.isDestroyed()) {
      overlay.webContents.send('setting-changed', key, value)
    }
    const main = getMainWindow()
    if (main && !main.isDestroyed()) {
      main.webContents.send('setting-changed', key, value)
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
    console.log('[VoxGen] IPC license:validate, key length:', key?.length)
    const result = await validateLicenseKey(key)
    console.log('[VoxGen] IPC license:validate result:', result.valid, result.plan)
    return result
  })

  ipcMain.handle('license:validate-email', async (_event, email: string) => {
    console.log('[VoxGen] IPC license:validate-email:', email)
    const result = await validateByEmail(email)
    console.log('[VoxGen] IPC license:validate-email result:', result.valid, result.plan)
    return result
  })

  ipcMain.handle('license:get-info', async () => {
    return getLicenseInfo()
  })

  ipcMain.handle('license:clear', async () => {
    clearLicense()
    console.log('[VoxGen] License cleared')
  })

  // Clipboard (reliable across Electron windows)
  ipcMain.handle('clipboard:write', async (_event, text: string) => {
    clipboard.writeText(text)
  })

  // Overlay resize
  ipcMain.on('overlay:expand', () => {
    expandOverlay()
  })

  ipcMain.on('overlay:expand-idle', () => {
    expandOverlayIdle()
  })

  ipcMain.on('overlay:shrink', () => {
    shrinkOverlay()
  })

  // Recording stopped from overlay UI — mark as processing
  ipcMain.on('recording-stopped-from-ui', () => {
    setIsRecording(false)
    setIsProcessing(true)
  })

  // Recording cancelled from overlay UI — reset all state
  ipcMain.on('recording-cancelled', () => {
    setIsRecording(false)
    setIsProcessing(false)
  })

  // Show main window (from overlay click)
  ipcMain.on('show-main-window', () => {
    const main = getMainWindow()
    if (main && !main.isDestroyed()) {
      if (main.isMinimized()) main.restore()
      main.show()
      main.focus()
    }
  })

  // Save recording audio to disk
  const recordingsDir = join(app.getPath('userData'), 'recordings')
  ipcMain.handle('recording:save', async (_event, filename: string, buffer: ArrayBuffer) => {
    try {
      await mkdir(recordingsDir, { recursive: true })
      const filePath = join(recordingsDir, filename)
      await writeFile(filePath, Buffer.from(buffer))
      console.log('[VoxGen] Saved recording:', filePath)
      return { success: true, path: filePath }
    } catch (err: any) {
      console.error('[VoxGen] Failed to save recording:', err)
      return { success: false, error: err.message }
    }
  })

  // Open recordings folder in file explorer
  ipcMain.handle('recording:open-folder', async () => {
    await mkdir(recordingsDir, { recursive: true })
    await shell.openPath(recordingsDir)
  })

  // Export a recording via save dialog
  ipcMain.handle('recording:export', async (_event, filename: string) => {
    const srcPath = join(recordingsDir, filename)
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: filename,
      filters: [{ name: 'WebM Audio', extensions: ['webm'] }],
    })
    if (canceled || !filePath) return { success: false }
    await copyFile(srcPath, filePath)
    return { success: true }
  })

  // App version
  ipcMain.handle('app:get-version', () => {
    return app.getVersion()
  })

  // Auto-update
  ipcMain.handle('update:check', async () => {
    return checkForUpdates()
  })

  ipcMain.handle('update:install', async () => {
    installUpdate()
  })
}
