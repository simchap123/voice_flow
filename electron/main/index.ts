import { app, BrowserWindow, globalShortcut, session } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMainWindow, createOverlayWindow, getMainWindow, getOverlayWindow } from './windows'
import { registerHotkeys, unregisterAllHotkeys } from './hotkeys'
import { createTray, destroyTray } from './tray'
import { registerIpcHandlers } from './ipc-handlers'
import { initStore, getSetting } from './store'
import { checkLicenseOnStartup, validateByEmail } from './license'
import { initAutoUpdater } from './updater'
import { trackAppLaunch, setupErrorReporting } from './event-tracker'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Register voxgen:// deep link protocol (for auto-activation after purchase)
if (process.defaultApp) {
  // Dev mode: register with path to electron executable
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('voxgen', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('voxgen')
}

// Deep link handler — parses voxgen://activate?email=xxx
async function handleDeepLink(url: string) {
  console.log('[VoxGen] Deep link received:', url)
  try {
    // Parse: voxgen://activate?email=xxx or voxgen://activate/email@example.com
    const parsed = new URL(url)
    if (parsed.hostname === 'activate' || parsed.pathname?.startsWith('//activate')) {
      const email = parsed.searchParams.get('email')?.trim().toLowerCase()
      if (email && email.includes('@') && email.length < 255) {
        console.log('[VoxGen] Deep link activation for:', email)
        const result = await validateByEmail(email)
        console.log('[VoxGen] Deep link validation result:', result.valid, result.plan)

        // Show main window and notify all renderer windows
        const mainWin = getMainWindow()
        if (mainWin && !mainWin.isDestroyed()) {
          if (mainWin.isMinimized()) mainWin.restore()
          mainWin.show()
          mainWin.focus()
        }
        // Broadcast to all windows so overlay also picks up the change
        for (const win of BrowserWindow.getAllWindows()) {
          if (!win.isDestroyed()) {
            win.webContents.send('deep-link-activated', { email, ...result })
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[VoxGen] Deep link error:', err.message)
  }
}

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

  // Windows: handle deep link on cold start (app wasn't running when link clicked)
  const deepLinkArg = process.argv.find(arg => arg.startsWith('voxgen://'))
  if (deepLinkArg) {
    // Wait a moment for windows to be ready, then handle
    setTimeout(() => handleDeepLink(deepLinkArg), 1500)
  }

  // macOS: handle deep link via open-url event
  app.on('open-url', (_event, url) => {
    if (url.startsWith('voxgen://')) {
      handleDeepLink(url)
    }
  })

  app.on('activate', () => {
    const mainWin = getMainWindow()
    if (!mainWin || mainWin.isDestroyed()) {
      createMainWindow()
    }
  })
})

app.on('second-instance', (_event, argv) => {
  const mainWin = getMainWindow()
  if (mainWin) {
    if (mainWin.isMinimized()) mainWin.restore()
    mainWin.show()
    mainWin.focus()
  }

  // Windows: deep link URL comes as last arg in argv
  const deepLinkUrl = argv.find(arg => arg.startsWith('voxgen://'))
  if (deepLinkUrl) {
    handleDeepLink(deepLinkUrl)
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
