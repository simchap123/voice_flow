import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { app } from 'electron'

let updateAvailableVersion: string | null = null
let updateDownloaded = false
let isQuittingForUpdate = false

export function isUpdating(): boolean {
  return isQuittingForUpdate
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
    isQuittingForUpdate = true
    autoUpdater.quitAndInstall(false, true)
  }
}
