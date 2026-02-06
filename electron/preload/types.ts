export interface ElectronAPI {
  // Window controls
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void

  // Recording events from main process
  onStartRecording: (callback: () => void) => () => void
  onStopRecording: (callback: () => void) => () => void
  onCancelRecording: (callback: () => void) => () => void

  // Text injection
  injectText: (text: string) => Promise<{ success: boolean; method: string }>

  // Overlay
  hideOverlay: () => void
  onTranscriptionComplete: (callback: (data: any) => void) => () => void

  // API Key
  saveApiKey: (key: string) => Promise<boolean>
  getApiKey: () => Promise<string | null>
  hasApiKey: () => Promise<boolean>

  // Settings
  getSettings: () => Promise<Record<string, any>>
  setSetting: (key: string, value: any) => Promise<{ success: boolean; error?: string }>

  // History
  getHistory: () => Promise<any[]>
  setHistory: (history: any[]) => Promise<void>

  // Snippets
  getSnippets: () => Promise<any[]>
  setSnippets: (snippets: any[]) => Promise<void>

  // Notify main window
  notifyTranscriptionComplete: (data: any) => void
}
