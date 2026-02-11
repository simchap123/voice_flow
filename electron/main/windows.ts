import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let previousFocusedWindow: number | null = null // Track window to restore focus to
let overlayDismissed = false
let fadeInterval: ReturnType<typeof setInterval> | null = null

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const DIST = process.env.DIST ?? path.join(__dirname, '../../dist')
const preloadPath = path.join(__dirname, '../preload/index.cjs')

// Overlay constants — fixed bounds, CSS handles visual states
const OVERLAY_WIDTH = 340
const OVERLAY_HEIGHT = 50

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 720,
    minWidth: 850,
    minHeight: 550,
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
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  overlayWindow = new BrowserWindow({
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    x: Math.round(screenWidth / 2 - OVERLAY_WIDTH / 2),
    y: screenHeight - OVERLAY_HEIGHT - 10,
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

  // Show overlay once loaded — always visible by default
  overlayWindow.webContents.on('did-finish-load', () => {
    console.log('[VoxGen] Overlay window loaded and ready')
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.showInactive()
    }
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
    overlayDismissed = false
    // Cancel any in-progress fade to prevent competing animations
    if (fadeInterval) {
      clearInterval(fadeInterval)
      fadeInterval = null
    }
    overlayWindow.setOpacity(0)
    overlayWindow.showInactive()
    // Quick fade in
    let opacity = 0
    fadeInterval = setInterval(() => {
      opacity = Math.min(opacity + 0.25, 1)
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.setOpacity(opacity)
      }
      if (opacity >= 1) {
        clearInterval(fadeInterval!)
        fadeInterval = null
      }
    }, 16)
  }
}

export function showOverlayIdle() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    showOverlay()
  }
}

// Kept for API compatibility — bounds are now fixed, CSS handles visual states
export function expandOverlay() {
  // No-op: overlay bounds are fixed at 340x50, recording UI handled by CSS
}

export function expandOverlayIdle() {
  // No-op: overlay bounds are fixed at 340x50, idle UI handled by CSS
}

export function shrinkOverlay() {
  // No-op: overlay bounds are fixed at 340x50, CSS handles minimized state
}

export function hideOverlay(instant = false) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayDismissed = true
    if (instant) {
      overlayWindow.setOpacity(0)
      overlayWindow.hide()
      return
    }
    // Cancel any in-progress fade to prevent competing animations
    if (fadeInterval) {
      clearInterval(fadeInterval)
      fadeInterval = null
    }
    // Smooth fade out
    let opacity = 1
    fadeInterval = setInterval(() => {
      opacity = Math.max(opacity - 0.2, 0)
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.setOpacity(opacity)
      }
      if (opacity <= 0) {
        clearInterval(fadeInterval!)
        fadeInterval = null
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.hide()
        }
      }
    }, 16)
  }
}

export function isOverlayDismissed(): boolean {
  return overlayDismissed
}
