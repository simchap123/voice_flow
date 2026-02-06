export interface AppSettings {
  hotkey: string
  language: string
  theme: 'dark' | 'light'
  autoCopy: boolean
  cleanupEnabled: boolean
  audioInputDeviceId: string
}

export const defaultSettings: AppSettings = {
  hotkey: 'Alt+Space',
  language: 'en',
  theme: 'dark',
  autoCopy: true,
  cleanupEnabled: true,
  audioInputDeviceId: 'default',
}
