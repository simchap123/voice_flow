import { Tray, Menu, app, nativeImage } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getMainWindow } from './windows'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let tray: Tray | null = null

export function createTray() {
  // In dev: resources/ is at project root; in production: it's in the asar's extraResources
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon-16.png')
    : path.join(__dirname, '../../resources/icon-16.png')
  const icon = nativeImage.createFromPath(iconPath)

  tray = new Tray(icon)
  tray.setToolTip('VoxGen - AI Dictation')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show VoxGen',
      click: () => {
        const mainWin = getMainWindow()
        mainWin?.show()
        mainWin?.focus()
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        // Force quit (bypass close-to-tray)
        const mainWin = getMainWindow()
        if (mainWin) {
          mainWin.removeAllListeners('close')
          mainWin.close()
        }
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    const mainWin = getMainWindow()
    if (mainWin?.isVisible()) {
      mainWin.hide()
    } else {
      mainWin?.show()
      mainWin?.focus()
    }
  })
}

export function destroyTray() {
  tray?.destroy()
  tray = null
}
