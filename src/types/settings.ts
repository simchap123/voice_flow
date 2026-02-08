import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType } from '@/lib/cleanup/types'

export interface AppSettings {
  // Recording
  holdHotkey: string
  toggleHotkey: string
  language: string
  audioInputDeviceId: string

  // STT provider
  sttProvider: STTProviderType
  localModelSize: 'tiny' | 'base' | 'small' | 'medium'

  // Cleanup provider
  cleanupProvider: CleanupProviderType
  cleanupEnabled: boolean

  // UI
  theme: 'dark' | 'light'
  autoCopy: boolean
}

export const defaultSettings: AppSettings = {
  holdHotkey: 'Alt',
  toggleHotkey: '',
  language: 'en',
  audioInputDeviceId: 'default',

  sttProvider: 'openai',
  localModelSize: 'base',

  cleanupProvider: 'openai',
  cleanupEnabled: true,

  theme: 'dark',
  autoCopy: true,
}
