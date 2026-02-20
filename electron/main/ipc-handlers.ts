import { ipcMain, BrowserWindow, clipboard, app, shell, dialog } from 'electron'
import { copyFile } from 'node:fs/promises'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { hideOverlay, getMainWindow, getOverlayWindow, expandOverlay, expandOverlayIdle, shrinkOverlay, expandOverlayForPrompts, shrinkOverlayToIdle, setOverlayClickThrough } from './windows'
import { injectText } from './text-injection'
import { setIsRecording, setIsProcessing } from './hotkeys'
import { reregisterHotkeys } from './hotkeys'
import {
  saveApiKey,
  getApiKey,
  hasApiKey,
  deleteApiKey,
  getAllSettings,
  setSetting,
  getHistory,
  setHistory,
  getSnippets,
  setSnippets,
  getCustomPrompts,
  setCustomPrompts,
  getLicenseInfo,
  clearLicense,
  getPowerModes,
  setPowerModes,
} from './store'
import { validateLicenseKey, validateByEmail } from './license'
import { checkForUpdates, installUpdate } from './updater'
import { trackUsage } from './usage-tracker'

function broadcastSettingChanged(key: string, value: any) {
  const overlay = getOverlayWindow()
  if (overlay && !overlay.isDestroyed()) {
    overlay.webContents.send('setting-changed', key, value)
  }
  const main = getMainWindow()
  if (main && !main.isDestroyed()) {
    main.webContents.send('setting-changed', key, value)
  }
}

export function registerIpcHandlers() {
  // Window controls
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  // Text injection
  ipcMain.handle('inject-text', async (_event, text: string) => {
    console.log('[VoxGen] inject-text IPC received, text length:', text?.length)
    setIsRecording(false)
    setIsProcessing(false)

    // Small delay then paste into focused app
    await new Promise(resolve => setTimeout(resolve, 100))
    const result = await injectText(text)
    console.log('[VoxGen] inject-text result:', result)
    return result
  })

  // Hide overlay
  ipcMain.on('hide-overlay', () => {
    hideOverlay()
    setIsRecording(false)
    setIsProcessing(false)
  })

  // Notify main window of transcription results + save to history
  ipcMain.on('transcription-complete', (_event, data) => {
    // Save to history directly in the store (overlay recordings)
    const history = getHistory()
    const entry = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }
    setHistory([entry, ...history])
    console.log('[VoxGen] Saved transcription to history:', entry.cleanedText?.slice(0, 50))

    // Fire-and-forget usage tracking (don't block the user)
    trackUsage(data).catch(() => {})

    // Also forward to main window for live UI updates
    const mainWin = getMainWindow()
    mainWin?.webContents.send('transcription-complete', data)
  })

  // API Key management — multi-provider support
  ipcMain.handle('api-key:save', async (_event, key: string, provider: string = 'openai') => {
    console.log(`[VoxGen] IPC api-key:save for ${provider}, key length:`, key?.length)
    const result = saveApiKey(key, provider)
    console.log(`[VoxGen] IPC api-key:save result:`, result)
    return result
  })

  ipcMain.handle('api-key:get', async (_event, provider: string = 'openai') => {
    const key = getApiKey(provider)
    console.log(`[VoxGen] IPC api-key:get for ${provider}, has key:`, !!key)
    return key
  })

  ipcMain.handle('api-key:has', async (_event, provider: string = 'openai') => {
    const has = hasApiKey(provider)
    console.log(`[VoxGen] IPC api-key:has for ${provider}:`, has)
    return has
  })

  ipcMain.handle('api-key:delete', async (_event, provider: string = 'openai') => {
    console.log(`[VoxGen] IPC api-key:delete for ${provider}`)
    return deleteApiKey(provider)
  })

  // Settings
  ipcMain.handle('settings:get-all', async () => {
    return getAllSettings()
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: any) => {
    setSetting(key as any, value)
    // Always broadcast so overlay/main stay in sync
    broadcastSettingChanged(key, value)
    if (key === 'holdHotkey' || key === 'toggleHotkey' || key === 'promptHotkey' || key === 'toggleTriggerMethod' || key === 'promptTriggerMethod') {
      return reregisterHotkeys()
    }
    return { success: true }
  })

  // History
  ipcMain.handle('history:get', async () => {
    return getHistory()
  })

  ipcMain.handle('history:set', async (_event, history: any[]) => {
    setHistory(history)
  })

  // Snippets
  ipcMain.handle('snippets:get', async () => {
    return getSnippets()
  })

  ipcMain.handle('snippets:set', async (_event, snippets: any[]) => {
    setSnippets(snippets)
    // Broadcast to all windows so overlay stays in sync with main window
    const overlay = getOverlayWindow()
    if (overlay && !overlay.isDestroyed()) {
      overlay.webContents.send('snippets-changed')
    }
    const main = getMainWindow()
    if (main && !main.isDestroyed()) {
      main.webContents.send('snippets-changed')
    }
  })

  // License
  ipcMain.handle('license:validate', async (_event, key: string) => {
    console.log('[VoxGen] IPC license:validate, key length:', key?.length)
    const result = await validateLicenseKey(key)
    console.log('[VoxGen] IPC license:validate result:', result.valid, result.plan)
    return result
  })

  ipcMain.handle('license:validate-email', async (_event, email: string) => {
    console.log('[VoxGen] IPC license:validate-email:', email)
    const result = await validateByEmail(email)
    console.log('[VoxGen] IPC license:validate-email result:', result.valid, result.plan)
    // Only broadcast email when validation succeeds — prevents invalid managed mode
    if (result.valid) {
      broadcastSettingChanged('userEmail', email.trim().toLowerCase())
    }
    return result
  })

  ipcMain.handle('license:get-info', async () => {
    return getLicenseInfo()
  })

  ipcMain.handle('license:clear', async () => {
    clearLicense()
    console.log('[VoxGen] License cleared')
    // Broadcast email removal so renderers can deactivate managed mode
    broadcastSettingChanged('userEmail', '')
  })

  ipcMain.handle('license:customer-portal', async (_event, email: string) => {
    const { netFetchJson } = await import('./license')
    try {
      const data = await netFetchJson('https://voxgenflow.vercel.app/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (data.url) {
        await shell.openExternal(data.url)
        return { success: true }
      }
      return { success: false, error: data.error || 'No portal URL returned' }
    } catch (err: any) {
      console.error('[VoxGen] Customer portal error:', err.message)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url)
  })

  // Clipboard (reliable across Electron windows)
  ipcMain.handle('clipboard:write', async (_event, text: string) => {
    clipboard.writeText(text)
  })

  // Custom prompts
  ipcMain.handle('prompts:get', async () => {
    return getCustomPrompts()
  })

  ipcMain.handle('prompts:set', async (_event, prompts: any[]) => {
    setCustomPrompts(prompts)
  })

  // Read clipboard text (for context injection at recording start)
  ipcMain.handle('clipboard:read', () => {
    return clipboard.readText()
  })

  // Get active window info (Windows only — for context injection)
  ipcMain.handle('window:get-active-info', async () => {
    if (process.platform !== 'win32') return null
    try {
      const { execFile } = await import('node:child_process')
      const { promisify } = await import('node:util')
      const execFileAsync = promisify(execFile)
      const script = `
        Add-Type -Name User32 -Namespace Win32Api -MemberDefinition @'
        [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int lpid);
'@
        $hwnd = [Win32Api.User32]::GetForegroundWindow()
        $pid = 0
        [Win32Api.User32]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
        $p = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($p) { Write-Output "$($p.ProcessName)|$($p.MainWindowTitle)" } else { Write-Output "|" }
      `
      const { stdout } = await execFileAsync('powershell', [
        '-NoProfile', '-NonInteractive', '-Command', script,
      ], { timeout: 3000 })
      const [processName, ...titleParts] = stdout.trim().split('|')
      const title = titleParts.join('|')
      console.log('[VoxGen] Active window:', processName, '|', title)
      return { processName: processName?.trim() || '', title: title?.trim() || '' }
    } catch (err: any) {
      console.warn('[VoxGen] Could not get active window:', err.message)
      return null
    }
  })

  // Overlay resize
  ipcMain.on('overlay:expand', () => {
    expandOverlay()
  })

  ipcMain.on('overlay:expand-idle', () => {
    expandOverlayIdle()
  })

  ipcMain.on('overlay:shrink', () => {
    shrinkOverlay()
  })

  // Overlay prompt picker expand/shrink (US-305)
  ipcMain.on('overlay:expand-for-prompts', (_e, count: number) => {
    expandOverlayForPrompts(count)
  })

  ipcMain.on('overlay:shrink-to-idle', () => {
    shrinkOverlayToIdle()
  })

  // Overlay click-through toggle
  ipcMain.on('overlay:set-click-through', (_e, ignore: boolean) => {
    setOverlayClickThrough(ignore)
  })

  // Power modes (Phase 4)
  ipcMain.handle('power-modes:get', () => {
    return getPowerModes()
  })

  ipcMain.handle('power-modes:set', (_e, modes: any[]) => {
    setPowerModes(modes)
  })

  // Recording stopped from overlay UI — mark as processing
  ipcMain.on('recording-stopped-from-ui', () => {
    setIsRecording(false)
    setIsProcessing(true)
  })

  // Recording cancelled from overlay UI — reset all state
  ipcMain.on('recording-cancelled', () => {
    setIsRecording(false)
    setIsProcessing(false)
  })

  // Show main window (from overlay click)
  ipcMain.on('show-main-window', () => {
    const main = getMainWindow()
    if (main && !main.isDestroyed()) {
      if (main.isMinimized()) main.restore()
      main.show()
      main.focus()
    }
  })

  // Save recording audio to disk
  const recordingsDir = join(app.getPath('userData'), 'recordings')
  ipcMain.handle('recording:save', async (_event, filename: string, buffer: ArrayBuffer) => {
    try {
      // Prevent path traversal — only allow plain filenames (no slashes or ..)
      const safeName = filename.replace(/[/\\]/g, '').replace(/\.\./g, '')
      if (!safeName || safeName !== filename) {
        return { success: false, error: 'Invalid filename' }
      }
      await mkdir(recordingsDir, { recursive: true })
      const filePath = join(recordingsDir, safeName)
      await writeFile(filePath, Buffer.from(buffer))
      console.log('[VoxGen] Saved recording:', filePath)
      return { success: true, path: filePath }
    } catch (err: any) {
      console.error('[VoxGen] Failed to save recording:', err)
      return { success: false, error: err.message }
    }
  })

  // Open recordings folder in file explorer
  ipcMain.handle('recording:open-folder', async () => {
    await mkdir(recordingsDir, { recursive: true })
    await shell.openPath(recordingsDir)
  })

  // Export a recording via save dialog
  ipcMain.handle('recording:export', async (_event, filename: string) => {
    const srcPath = join(recordingsDir, filename)
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: filename,
      filters: [{ name: 'WebM Audio', extensions: ['webm'] }],
    })
    if (canceled || !filePath) return { success: false }
    await copyFile(srcPath, filePath)
    return { success: true }
  })

  // App version
  ipcMain.handle('app:get-version', () => {
    return app.getVersion()
  })

  // Auto-update
  ipcMain.handle('update:check', async () => {
    return checkForUpdates()
  })

  ipcMain.handle('update:install', async () => {
    installUpdate()
  })
}
