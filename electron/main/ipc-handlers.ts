import { ipcMain, BrowserWindow } from 'electron'
import { hideOverlay, getMainWindow, getOverlayWindow } from './windows'
import { injectText } from './text-injection'
import { setIsRecording } from './hotkeys'
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
} from './store'

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
    hideOverlay()
    setIsRecording(false)

    // Small delay for focus to return to previous app
    await new Promise(resolve => setTimeout(resolve, 100))
    return injectText(text)
  })

  // Hide overlay
  ipcMain.on('hide-overlay', () => {
    hideOverlay()
    setIsRecording(false)
  })

  // Notify main window of transcription results
  ipcMain.on('transcription-complete', (_event, data) => {
    const mainWin = getMainWindow()
    mainWin?.webContents.send('transcription-complete', data)
  })

  // API Key management
  ipcMain.handle('api-key:save', async (_event, key: string) => {
    return saveApiKey(key)
  })

  ipcMain.handle('api-key:get', async () => {
    return getApiKey()
  })

  ipcMain.handle('api-key:has', async () => {
    return hasApiKey()
  })

  // Settings
  ipcMain.handle('settings:get-all', async () => {
    return getAllSettings()
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: any) => {
    setSetting(key as any, value)
    if (key === 'hotkey') {
      reregisterHotkeys()
    }
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
}
