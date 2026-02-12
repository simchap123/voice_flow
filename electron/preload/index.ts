import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from './types'

const api: ElectronAPI = {
  // Window controls
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),

  // Recording events from main process (global hotkey triggers)
  onStartRecording: (callback: (data?: { mode?: string }) => void) => {
    const handler = (_event: any, data?: { mode?: string }) => callback(data)
    ipcRenderer.on('start-recording', handler)
    return () => ipcRenderer.removeListener('start-recording', handler)
  },

  onStopRecording: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('stop-recording', handler)
    return () => ipcRenderer.removeListener('stop-recording', handler)
  },

  onCancelRecording: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('cancel-recording', handler)
    return () => ipcRenderer.removeListener('cancel-recording', handler)
  },

  // Text injection into previously focused app
  injectText: (text: string) => ipcRenderer.invoke('inject-text', text),

  // Overlay control
  hideOverlay: () => ipcRenderer.send('hide-overlay'),

  onTranscriptionComplete: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('transcription-complete', handler)
    return () => ipcRenderer.removeListener('transcription-complete', handler)
  },

  // API Key management — multi-provider
  saveApiKey: (key: string, provider: string = 'openai') => ipcRenderer.invoke('api-key:save', key, provider),
  getApiKey: (provider: string = 'openai') => ipcRenderer.invoke('api-key:get', provider),
  hasApiKey: (provider: string = 'openai') => ipcRenderer.invoke('api-key:has', provider),
  deleteApiKey: (provider: string = 'openai') => ipcRenderer.invoke('api-key:delete', provider),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get-all'),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),

  // History
  getHistory: () => ipcRenderer.invoke('history:get'),
  setHistory: (history: any[]) => ipcRenderer.invoke('history:set', history),

  // Snippets
  getSnippets: () => ipcRenderer.invoke('snippets:get'),
  setSnippets: (snippets: any[]) => ipcRenderer.invoke('snippets:set', snippets),
  onSnippetsChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('snippets-changed', handler)
    return () => ipcRenderer.removeListener('snippets-changed', handler)
  },

  // License
  validateLicense: (key: string) => ipcRenderer.invoke('license:validate', key),
  validateByEmail: (email: string) => ipcRenderer.invoke('license:validate-email', email),
  getLicenseInfo: () => ipcRenderer.invoke('license:get-info'),
  clearLicense: () => ipcRenderer.invoke('license:clear'),
  onTrialExpired: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('trial-expired', handler)
    return () => ipcRenderer.removeListener('trial-expired', handler)
  },

  // Clipboard
  copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard:write', text),

  // Overlay resize
  expandOverlay: () => ipcRenderer.send('overlay:expand'),
  expandOverlayIdle: () => ipcRenderer.send('overlay:expand-idle'),
  shrinkOverlay: () => ipcRenderer.send('overlay:shrink'),

  // Settings sync across windows
  onSettingChanged: (callback: (key: string, value: any) => void) => {
    const handler = (_event: any, key: string, value: any) => callback(key, value)
    ipcRenderer.on('setting-changed', handler)
    return () => ipcRenderer.removeListener('setting-changed', handler)
  },

  // Show main window
  showMainWindow: () => ipcRenderer.send('show-main-window'),

  // Notify main process that recording was stopped/cancelled from overlay UI
  notifyRecordingStopped: () => ipcRenderer.send('recording-stopped-from-ui'),
  notifyRecordingCancelled: () => ipcRenderer.send('recording-cancelled'),

  // Cross-window communication
  notifyTranscriptionComplete: (data: any) => ipcRenderer.send('transcription-complete', data),

  // Recordings
  saveRecording: (filename: string, buffer: ArrayBuffer) => ipcRenderer.invoke('recording:save', filename, buffer),
  openRecordingsFolder: () => ipcRenderer.invoke('recording:open-folder'),
  exportRecording: (filename: string) => ipcRenderer.invoke('recording:export', filename),

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
}

contextBridge.exposeInMainWorld('electronAPI', api)
