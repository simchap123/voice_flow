import { app, BrowserWindow, globalShortcut } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMainWindow, createOverlayWindow, getMainWindow, getOverlayWindow } from './windows'
import { registerHotkeys, unregisterAllHotkeys } from './hotkeys'
import { createTray, destroyTray } from './tray'
import { registerIpcHandlers } from './ipc-handlers'
import { initStore } from './store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

process.env.DIST_ELECTRON = path.join(__dirname, '..')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

app.whenReady().then(async () => {
  initStore()
  registerIpcHandlers()

  createMainWindow()
  createOverlayWindow()
  createTray()
  registerHotkeys()

  app.on('activate', () => {
    const mainWin = getMainWindow()
    if (!mainWin || mainWin.isDestroyed()) {
      createMainWindow()
    }
  })
})

app.on('second-instance', () => {
  const mainWin = getMainWindow()
  if (mainWin) {
    if (mainWin.isMinimized()) mainWin.restore()
    mainWin.show()
    mainWin.focus()
  }
})

app.on('will-quit', () => {
  unregisterAllHotkeys()
  destroyTray()
})

app.on('window-all-closed', () => {
  // Keep running in tray on Windows
  if (process.platform !== 'win32') {
    app.quit()
  }
})
