import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { app } from 'electron'

let updateAvailableVersion: string | null = null
let updateDownloaded = false

export function initAutoUpdater() {
  if (!app.isPackaged) {
    console.log('[VoiceFlow] Skipping auto-updater in dev mode')
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[VoiceFlow] Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[VoiceFlow] Update available:', info.version)
    updateAvailableVersion = info.version
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[VoiceFlow] No update available')
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[VoiceFlow] Download progress: ${Math.round(progress.percent)}%`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[VoiceFlow] Update downloaded:', info.version)
    updateDownloaded = true
    updateAvailableVersion = info.version
  })

  autoUpdater.on('error', (err) => {
    console.error('[VoiceFlow] Auto-updater error:', err.message)
  })

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('[VoiceFlow] Failed to check for updates:', err.message)
  })
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
    console.error('[VoiceFlow] Manual update check failed:', err.message)
  }

  return { updateAvailable: false }
}

export function installUpdate() {
  if (updateDownloaded) {
    autoUpdater.quitAndInstall()
  }
}
