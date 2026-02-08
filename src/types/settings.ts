import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType } from '@/lib/cleanup/types'

export interface AppSettings {
  // Recording
  hotkey: string
  hotkeyMode: 'hold' | 'toggle'
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
  hotkey: 'Alt',
  hotkeyMode: 'hold',
  language: 'en',
  audioInputDeviceId: 'default',

  sttProvider: 'openai',
  localModelSize: 'base',

  cleanupProvider: 'openai',
  cleanupEnabled: true,

  theme: 'dark',
  autoCopy: true,
}
