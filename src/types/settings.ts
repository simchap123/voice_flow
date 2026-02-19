import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType, OutputLength } from '@/lib/cleanup/types'

export type LicenseStatus = 'none' | 'active' | 'expired' | 'invalid'

export interface AppSettings {
  // Recording
  holdHotkey: string
  toggleHotkey: string
  toggleTriggerMethod: 'single' | 'double-tap'
  promptHotkey: string
  promptTriggerMethod: 'single' | 'double-tap'
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

  // Phase 2: Context-Aware AI Enhancement
  fillerWordRemoval: boolean
  useClipboardContext: boolean
  useWindowContext: boolean
  customVocabulary: string[]
  wordReplacements: Array<{ original: string; replacement: string; enabled: boolean }>

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

  // Onboarding
  onboardingComplete: boolean

  // Phase 3: Custom Prompts
  activePromptId: string
  // Phase 4: Power Modes
  powerModesEnabled: boolean
}

export const defaultSettings: AppSettings = {
  holdHotkey: 'Alt',
  toggleHotkey: 'Alt+Left',
  toggleTriggerMethod: 'single',
  promptHotkey: 'Control+Shift+Tab',
  promptTriggerMethod: 'single',
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

  fillerWordRemoval: false,
  useClipboardContext: true,
  useWindowContext: true,
  customVocabulary: [],
  wordReplacements: [],

  theme: 'dark',
  autoCopy: true,

  licenseKey: '',
  licenseStatus: 'none',
  licensePlan: '',
  licenseExpiresAt: '',
  trialStartedAt: 0,
  lastLicenseCheck: 0,

  onboardingComplete: false,
  activePromptId: 'default',
  powerModesEnabled: false,
}
