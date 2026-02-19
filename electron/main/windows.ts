import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isUpdating } from './updater'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let previousFocusedWindow: number | null = null // Track window to restore focus to
let overlayDismissed = false
let fadeInterval: ReturnType<typeof setInterval> | null = null
let mouseTrackInterval: ReturnType<typeof setInterval> | null = null
let lastDisplayId: number | null = null

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const DIST = process.env.DIST ?? path.join(__dirname, '../../dist')
const preloadPath = path.join(__dirname, '../preload/index.cjs')

// Overlay constants — compact floating pill
const OVERLAY_WIDTH = 320
const OVERLAY_HEIGHT = 56

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
    // Allow quit when installing an update
    if (isUpdating()) return
    // Minimize to tray instead of closing
    e.preventDefault()
    mainWindow?.hide()
  })

  return mainWindow
}

/** Move overlay to the bottom-center of the display the cursor is on */
function moveOverlayToCurrentDisplay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return

  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)

  // Only move if the cursor changed displays
  if (display.id === lastDisplayId) return
  lastDisplayId = display.id

  const { x: dx, y: dy, width: dw, height: dh } = display.workArea
  const newX = Math.round(dx + dw / 2 - OVERLAY_WIDTH / 2)
  const newY = dy + dh - OVERLAY_HEIGHT - 10
  overlayWindow.setBounds({ x: newX, y: newY, width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT })
}

/** Start polling the cursor position to keep overlay on the active display */
function startMouseTracking() {
  if (mouseTrackInterval) return
  lastDisplayId = null // Force initial move
  moveOverlayToCurrentDisplay()
  mouseTrackInterval = setInterval(moveOverlayToCurrentDisplay, 250)
}

function stopMouseTracking() {
  if (mouseTrackInterval) {
    clearInterval(mouseTrackInterval)
    mouseTrackInterval = null
  }
}

export function createOverlayWindow(): BrowserWindow {
  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)
  const { x: dx, y: dy, width: dw, height: dh } = display.workArea
  lastDisplayId = display.id

  overlayWindow = new BrowserWindow({
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    x: Math.round(dx + dw / 2 - OVERLAY_WIDTH / 2),
    y: dy + dh - OVERLAY_HEIGHT - 10,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false, // Non-focus-stealing — never takes keyboard focus from user's active app
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Use highest z-level so overlay is truly on top of everything
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')

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
      startMouseTracking()
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
    // Snap to current display before showing
    lastDisplayId = null
    moveOverlayToCurrentDisplay()
    overlayWindow.setOpacity(0)
    overlayWindow.showInactive()
    // Re-assert top-most level (Windows can lose it after focus changes)
    overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    startMouseTracking()
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

/** Expand overlay vertically to show inline prompt picker (US-305) — expands upward */
export function expandOverlayForPrompts(count: number) {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  const height = OVERLAY_HEIGHT + count * 44 + 8
  const { x, y, width } = overlayWindow.getBounds()
  // Expand upward: keep bottom edge fixed
  const newY = y - (height - OVERLAY_HEIGHT)
  overlayWindow.setBounds({ x, y: newY, width, height })
}

/** Shrink overlay back to idle size after prompt picker closes */
export function shrinkOverlayToIdle() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  const { x, y, width, height } = overlayWindow.getBounds()
  // Restore top edge to match original bottom position
  const newY = y + (height - OVERLAY_HEIGHT)
  overlayWindow.setBounds({ x, y: newY, width, height: OVERLAY_HEIGHT })
}

export function hideOverlay(instant = false) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayDismissed = true
    stopMouseTracking()
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
