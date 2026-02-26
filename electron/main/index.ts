import { app, BrowserWindow, dialog, globalShortcut, session } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync, mkdirSync } from 'node:fs'
import { createMainWindow, createOverlayWindow, getMainWindow, getOverlayWindow } from './windows'
import { registerHotkeys, unregisterAllHotkeys } from './hotkeys'
import { createTray, destroyTray } from './tray'
import { registerIpcHandlers } from './ipc-handlers'
import { initStore, getSetting } from './store'
import { checkLicenseOnStartup, validateByEmail } from './license'
import { initAutoUpdater } from './updater'
import { trackAppLaunch, setupErrorReporting } from './event-tracker'

// --- Global crash handlers: log + show error dialog so crashes are never silent ---
function logCrash(label: string, err: unknown) {
  const message = err instanceof Error ? err.stack || err.message : String(err)
  const logLine = `[${new Date().toISOString()}] ${label}: ${message}\n`
  try {
    const logDir = app.getPath('userData')
    mkdirSync(logDir, { recursive: true })
    writeFileSync(path.join(logDir, 'crash.log'), logLine, { flag: 'a' })
  } catch { /* best effort */ }
  console.error(`[VoxGen] ${label}:`, message)
}

process.on('uncaughtException', (err) => {
  logCrash('Uncaught exception', err)
  dialog.showErrorBox('VoxGen Error', `An unexpected error occurred:\n\n${err.message}\n\nThe app will now close. Check crash.log in %APPDATA%\\VoxGen for details.`)
  app.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logCrash('Unhandled rejection', reason)
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Register voxgen:// deep link protocol (for auto-activation after purchase)
// Only register in production — NSIS installer handles primary registration.
// In dev mode, skip to avoid overwriting the production registration with electron.exe
// (which causes Chrome to show "Open Electron?" instead of "Open VoxGen?").
if (!process.defaultApp) {
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

// Enable WebGPU for faster local Whisper inference (must be before app.whenReady)
app.commandLine.appendSwitch('enable-unsafe-webgpu')

process.env.DIST_ELECTRON = path.join(__dirname, '..')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

app.whenReady().then(async () => {
  try {
    // Auto-grant microphone permission so overlay window doesn't need user interaction
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'media') {
        callback(true)
      } else {
        callback(false)
      }
    })

    console.log('[VoxGen] Initializing store...')
    initStore()
    console.log('[VoxGen] Registering IPC handlers...')
    registerIpcHandlers()

    console.log('[VoxGen] Creating main window...')
    createMainWindow()
    console.log('[VoxGen] Creating overlay window...')
    createOverlayWindow()
    console.log('[VoxGen] Creating tray...')
    createTray()
    console.log('[VoxGen] Registering hotkeys...')
    registerHotkeys()

    console.log('[VoxGen] Core initialization complete.')

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
  } catch (err: any) {
    logCrash('App initialization failed', err)
    dialog.showErrorBox(
      'VoxGen Failed to Start',
      `Initialization error:\n\n${err.message}\n\nCheck crash.log in %APPDATA%\\VoxGen for details.`
    )
    app.exit(1)
  }
}).catch((err: any) => {
  logCrash('app.whenReady() failed', err)
  app.exit(1)
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
