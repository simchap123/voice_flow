import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const DIST = process.env.DIST ?? path.join(__dirname, '../../dist')
const preloadPath = path.join(__dirname, '../preload/index.cjs')

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 700,
    minHeight: 500,
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    backgroundColor: '#0a0e1a',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(DIST, 'index.html'))
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // Open devtools in dev mode
    if (VITE_DEV_SERVER_URL) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' })
    }
  })

  mainWindow.on('close', (e) => {
    // Minimize to tray instead of closing
    e.preventDefault()
    mainWindow?.hide()
  })

  return mainWindow
}

export function createOverlayWindow(): BrowserWindow {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize

  overlayWindow = new BrowserWindow({
    width: 380,
    height: 200,
    x: Math.round(screenWidth / 2 - 190),
    y: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: true, // Must be focusable for mic permission + MediaRecorder
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    overlayWindow.loadURL(`${VITE_DEV_SERVER_URL}#/overlay`)
  } else {
    overlayWindow.loadFile(path.join(DIST, 'index.html'), { hash: '/overlay' })
  }

  // Track when overlay has finished loading (API key + settings ready)
  overlayWindow.webContents.on('did-finish-load', () => {
    console.log('[VoiceFlow] Overlay window loaded and ready')
  })

  return overlayWindow
}

export function isOverlayReady(): boolean {
  return !!(overlayWindow && !overlayWindow.isDestroyed() && !overlayWindow.webContents.isLoading())
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow
}

export function showOverlay() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setOpacity(0)
    overlayWindow.show()
    // Smooth fade in
    let opacity = 0
    const fadeIn = setInterval(() => {
      opacity = Math.min(opacity + 0.15, 1)
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.setOpacity(opacity)
      }
      if (opacity >= 1) clearInterval(fadeIn)
    }, 16)
  }
}

export function hideOverlay(instant = false) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (instant) {
      overlayWindow.setOpacity(0)
      overlayWindow.hide()
      return
    }
    // Smooth fade out
    let opacity = 1
    const fadeOut = setInterval(() => {
      opacity = Math.max(opacity - 0.2, 0)
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.setOpacity(opacity)
      }
      if (opacity <= 0) {
        clearInterval(fadeOut)
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.hide()
        }
      }
    }, 16)
  }
}
