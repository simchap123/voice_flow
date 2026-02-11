import { app, BrowserWindow, globalShortcut, session } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMainWindow, createOverlayWindow, getMainWindow, getOverlayWindow } from './windows'
import { registerHotkeys, unregisterAllHotkeys } from './hotkeys'
import { createTray, destroyTray } from './tray'
import { registerIpcHandlers } from './ipc-handlers'
import { initStore, getSetting } from './store'
import { checkLicenseOnStartup } from './license'
import { initAutoUpdater } from './updater'
import { trackAppLaunch, setupErrorReporting } from './event-tracker'

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
  // Auto-grant microphone permission so overlay window doesn't need user interaction
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true)
    } else {
      callback(false)
    }
  })

  initStore()
  registerIpcHandlers()

  createMainWindow()
  createOverlayWindow()
  createTray()
  registerHotkeys()

  // Check license validity on startup (non-blocking)
  checkLicenseOnStartup().catch(err => {
    console.warn('[VoxGen] License check on startup failed:', err.message)
  })

  // Check for updates (non-blocking)
  initAutoUpdater()

  // Setup error reporting (non-blocking)
  setupErrorReporting()

  // Track app launch (non-blocking, fire-and-forget)
  const isFirstLaunch = getSetting('trialStartedAt') > Date.now() - 10000 // within 10s = first launch
  trackAppLaunch(isFirstLaunch)

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
