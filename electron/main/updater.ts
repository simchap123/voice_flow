import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { app } from 'electron'
import { getMainWindow } from './windows'
import { getIsRecording } from './hotkeys'

let updateAvailableVersion: string | null = null
let updateDownloaded = false
let isQuittingForUpdate = false
let autoInstallTimer: ReturnType<typeof setInterval> | null = null

export function isUpdating(): boolean {
  return isQuittingForUpdate
}

function broadcastUpdateStatus(status: string, version?: string) {
  const main = getMainWindow()
  if (main && !main.isDestroyed()) {
    main.webContents.send('update-status', { status, version })
  }
}

// Try to auto-install: wait until user is not recording, then quit and install
function scheduleAutoInstall() {
  if (autoInstallTimer) return // already scheduled

  console.log('[VoxGen] Auto-install scheduled — waiting for idle...')

  // Check every 5 seconds if user is idle (not recording)
  autoInstallTimer = setInterval(() => {
    if (!getIsRecording()) {
      console.log('[VoxGen] User idle — auto-installing update...')
      if (autoInstallTimer) clearInterval(autoInstallTimer)
      autoInstallTimer = null
      isQuittingForUpdate = true
      autoUpdater.quitAndInstall(true, true)
    }
  }, 5000)
}

export function initAutoUpdater() {
  if (!app.isPackaged) {
    console.log('[VoxGen] Skipping auto-updater in dev mode (run installed app to test)')
    return
  }

  console.log('[VoxGen] Auto-updater starting, current version:', app.getVersion())
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[VoxGen] Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[VoxGen] Update available:', info.version)
    updateAvailableVersion = info.version
    broadcastUpdateStatus('downloading', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[VoxGen] No update available')
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[VoxGen] Download progress: ${Math.round(progress.percent)}%`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[VoxGen] Update downloaded:', info.version)
    updateDownloaded = true
    updateAvailableVersion = info.version
    broadcastUpdateStatus('ready', info.version)

    // Auto-install when user is idle (not recording)
    scheduleAutoInstall()
  })

  autoUpdater.on('error', (err) => {
    console.error('[VoxGen] Auto-updater error:', err.message)
  })

  // Check on startup
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('[VoxGen] Failed to check for updates:', err.message)
  })

  // Re-check every 24 hours while app is running
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
  setInterval(() => {
    console.log('[VoxGen] Periodic update check (24h)')
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('[VoxGen] Periodic update check failed:', err.message)
    })
  }, TWENTY_FOUR_HOURS)
}

export async function checkForUpdates(): Promise<{ updateAvailable: boolean; version?: string; downloaded?: boolean }> {
  if (!app.isPackaged) {
    return { updateAvailable: false }
  }

  try {
    const result = await autoUpdater.checkForUpdates()
    if (result && result.updateInfo) {
      const available = result.updateInfo.version !== app.getVersion()
      return {
        updateAvailable: available,
        version: available ? result.updateInfo.version : undefined,
        downloaded: updateDownloaded,
      }
    }
  } catch (err: any) {
    console.error('[VoxGen] Manual update check failed:', err.message)
  }

  return { updateAvailable: false }
}

export function installUpdate() {
  if (updateDownloaded) {
    if (autoInstallTimer) clearInterval(autoInstallTimer)
    autoInstallTimer = null
    isQuittingForUpdate = true
    autoUpdater.quitAndInstall(true, true)
  }
}
