import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from './types'

const api: ElectronAPI = {
  // Window controls
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),

  // Recording events from main process (global hotkey triggers)
  onStartRecording: (callback: () => void) => {
    const handler = () => callback()
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

  // API Key management (encrypted with safeStorage)
  saveApiKey: (key: string) => ipcRenderer.invoke('api-key:save', key),
  getApiKey: () => ipcRenderer.invoke('api-key:get'),
  hasApiKey: () => ipcRenderer.invoke('api-key:has'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get-all'),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),

  // History
  getHistory: () => ipcRenderer.invoke('history:get'),
  setHistory: (history: any[]) => ipcRenderer.invoke('history:set', history),

  // Snippets
  getSnippets: () => ipcRenderer.invoke('snippets:get'),
  setSnippets: (snippets: any[]) => ipcRenderer.invoke('snippets:set', snippets),

  // Cross-window communication
  notifyTranscriptionComplete: (data: any) => ipcRenderer.send('transcription-complete', data),
}

contextBridge.exposeInMainWorld('electronAPI', api)
