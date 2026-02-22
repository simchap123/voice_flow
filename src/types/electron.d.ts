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
  setSetting: (key: string, value: any) => Promise<{ success: boolean; error?: string }>
  getHistory: () => Promise<any[]>
  setHistory: (history: any[]) => Promise<void>
  getSnippets: () => Promise<any[]>
  setSnippets: (snippets: any[]) => Promise<void>
  notifyTranscriptionComplete: (data: any) => void
  validateLicense: (key: string) => Promise<{ valid: boolean; plan?: string; error?: string; trialDaysLeft?: number }>
  validateByEmail: (email: string) => Promise<{ valid: boolean; plan?: string; error?: string; trialDaysLeft?: number }>
  getLicenseInfo: () => Promise<any>
  clearLicense: () => Promise<void>
  openCustomerPortal: (email: string) => Promise<{ success: boolean; error?: string }>
  openExternal: (url: string) => Promise<void>
  onTrialExpired: (callback: () => void) => () => void
  onDeepLinkActivated: (callback: (data: { email: string; valid: boolean; plan?: string; expiresAt?: string | null }) => void) => () => void
  // Overlay prompt picker (US-305)
  expandForPrompts?: (count: number) => void
  shrinkToIdle?: () => void
  // Power modes (Phase 4)
  getPowerModes?: () => Promise<any[]>
  setPowerModes?: (modes: any[]) => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
