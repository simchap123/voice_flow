export interface ElectronAPI {
  // Window controls
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void

  // Recording events from main process
  onStartRecording: (callback: (data?: { mode?: string }) => void) => () => void
  onStopRecording: (callback: () => void) => () => void
  onCancelRecording: (callback: () => void) => () => void

  // Text injection
  injectText: (text: string) => Promise<{ success: boolean; method: string }>

  // Overlay
  hideOverlay: () => void
  onTranscriptionComplete: (callback: (data: any) => void) => () => void

  // API Key — multi-provider
  saveApiKey: (key: string, provider?: string) => Promise<boolean>
  getApiKey: (provider?: string) => Promise<string | null>
  hasApiKey: (provider?: string) => Promise<boolean>
  deleteApiKey: (provider?: string) => Promise<boolean>

  // Settings
  getSettings: () => Promise<Record<string, any>>
  setSetting: (key: string, value: any) => Promise<{ success: boolean; error?: string }>

  // History
  getHistory: () => Promise<any[]>
  setHistory: (history: any[]) => Promise<void>

  // Snippets
  getSnippets: () => Promise<any[]>
  setSnippets: (snippets: any[]) => Promise<void>

  // License
  validateLicense: (key: string) => Promise<{ valid: boolean; plan?: string; expiresAt?: string | null; error?: string }>
  getLicenseInfo: () => Promise<{ licenseKey: string; licenseStatus: string; licensePlan: string; licenseExpiresAt: string; trialStartedAt: number; lastLicenseCheck: number }>
  clearLicense: () => Promise<void>
  onTrialExpired: (callback: () => void) => () => void

  // Clipboard
  copyToClipboard: (text: string) => Promise<void>

  // Overlay resize
  expandOverlay: () => void
  shrinkOverlay: () => void

  // Settings sync across windows
  onSettingChanged: (callback: (key: string, value: any) => void) => () => void

  // Show main window
  showMainWindow: () => void

  // Notify main process that recording was stopped/cancelled from overlay UI
  notifyRecordingStopped: () => void
  notifyRecordingCancelled: () => void

  // Notify main window
  notifyTranscriptionComplete: (data: any) => void
}
