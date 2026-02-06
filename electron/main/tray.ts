import { Tray, Menu, app, nativeImage } from 'electron'
import path from 'node:path'
import { getMainWindow } from './windows'

let tray: Tray | null = null

export function createTray() {
  // Create a simple 16x16 tray icon programmatically
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA4ElEQVQ4T6WTwQ3CMBBEZxYKgA6ggNABdEAqCB1AB6EC6ICkA+gAOoAKSAewA3Ls2ImdSOxp7f9/PLuWOPBjB/ZrAjMAFwBXAL2A+wJYkvwKM9sCmJL8TjMBMAUwI/mbA+4AJiS/SsASwITkT+7aNiJAezbJr3TPZQY/klxX5UsDlE0x4EvypwywArAg+Z0BelHAguRPHhBJnAlyrVqAAJ0jZONIFgYvN0DdCiQ3uf5OZ7BcB+pYIdeBB2AG4G7kZzMT07hDkg/JVUxQaQaFJhP76V9QJKl0i+p/9e8fvKVuMHVVVSwAAAAASUVORK5CYII='
  )

  tray = new Tray(icon)
  tray.setToolTip('VoiceFlow - AI Dictation')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show VoiceFlow',
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
