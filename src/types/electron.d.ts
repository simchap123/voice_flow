export interface ElectronAPI {
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
  onStartRecording: (callback: () => void) => () => void
  onStopRecording: (callback: () => void) => () => void
  onCancelRecording: (callback: () => void) => () => void
  injectText: (text: string) => Promise<{ success: boolean; method: string }>
  hideOverlay: () => void
  onTranscriptionComplete: (callback: (data: any) => void) => () => void
  saveApiKey: (key: string) => Promise<boolean>
  getApiKey: () => Promise<string | null>
  hasApiKey: () => Promise<boolean>
  getSettings: () => Promise<Record<string, any>>
  setSetting: (key: string, value: any) => Promise<void>
  getHistory: () => Promise<any[]>
  setHistory: (history: any[]) => Promise<void>
  getSnippets: () => Promise<any[]>
  setSnippets: (snippets: any[]) => Promise<void>
  notifyTranscriptionComplete: (data: any) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
