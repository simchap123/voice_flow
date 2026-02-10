import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType, OutputLength } from '@/lib/cleanup/types'

export type LicenseStatus = 'none' | 'active' | 'expired' | 'invalid'

export interface AppSettings {
  // Recording
  holdHotkey: string
  toggleHotkey: string
  promptHotkey: string
  doubleTapHotkey: string
  language: string
  audioInputDeviceId: string

  // STT provider
  sttProvider: STTProviderType
  localModelSize: 'tiny' | 'base' | 'small' | 'medium'

  // Cleanup provider
  cleanupProvider: CleanupProviderType
  cleanupEnabled: boolean
  codeMode: boolean

  // Content generation
  outputLength: OutputLength
  keywordTriggersEnabled: boolean
  promptRefinementEnabled: boolean

  // UI
  theme: 'dark' | 'light'
  autoCopy: boolean

  // License
  licenseKey: string
  licenseStatus: LicenseStatus
  licensePlan: string
  licenseExpiresAt: string
  trialStartedAt: number
  lastLicenseCheck: number
}

export const defaultSettings: AppSettings = {
  holdHotkey: 'Alt',
  toggleHotkey: '',
  promptHotkey: '',
  doubleTapHotkey: '',
  language: 'en',
  audioInputDeviceId: 'default',

  sttProvider: 'openai',
  localModelSize: 'base',

  cleanupProvider: 'openai',
  cleanupEnabled: true,
  codeMode: false,

  outputLength: 'medium',
  keywordTriggersEnabled: true,
  promptRefinementEnabled: false,

  theme: 'dark',
  autoCopy: true,

  licenseKey: '',
  licenseStatus: 'none',
  licensePlan: '',
  licenseExpiresAt: '',
  trialStartedAt: 0,
  lastLicenseCheck: 0,
}
