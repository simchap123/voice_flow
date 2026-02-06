import { safeStorage } from 'electron'
import Store from 'electron-store'

let store: Store | null = null

export interface AppSettings {
  hotkey: string
  language: string
  theme: 'dark' | 'light'
  autoCopy: boolean
  cleanupEnabled: boolean
  audioInputDeviceId: string
}

const defaults: AppSettings = {
  hotkey: 'Alt+Space',
  language: 'en',
  theme: 'dark',
  autoCopy: true,
  cleanupEnabled: true,
  audioInputDeviceId: 'default',
}

export function initStore() {
  store = new Store({
    defaults,
    name: 'voiceflow-settings',
  })
}

export function getStore(): Store | null {
  return store
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return (store?.get(key) as AppSettings[K]) ?? defaults[key]
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  store?.set(key, value)
}

export function getAllSettings(): AppSettings {
  if (!store) return defaults
  return {
    hotkey: store.get('hotkey', defaults.hotkey) as string,
    language: store.get('language', defaults.language) as string,
    theme: store.get('theme', defaults.theme) as 'dark' | 'light',
    autoCopy: store.get('autoCopy', defaults.autoCopy) as boolean,
    cleanupEnabled: store.get('cleanupEnabled', defaults.cleanupEnabled) as boolean,
    audioInputDeviceId: store.get('audioInputDeviceId', defaults.audioInputDeviceId) as string,
  }
}

// Secure API key storage using OS-level encryption (DPAPI on Windows)
export function saveApiKey(key: string): boolean {
  if (!safeStorage.isEncryptionAvailable()) {
    // Fallback: store in plain text (not ideal)
    store?.set('openai_api_key_plain', key)
    return false
  }
  const encrypted = safeStorage.encryptString(key)
  store?.set('openai_api_key', encrypted.toString('base64'))
  store?.delete('openai_api_key_plain')
  return true
}

export function getApiKey(): string | null {
  if (!store) return null

  const encrypted = store.get('openai_api_key') as string | undefined
  if (encrypted && safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(encrypted, 'base64')
      return safeStorage.decryptString(buffer)
    } catch {
      return null
    }
  }

  // Fallback: plain text
  return (store.get('openai_api_key_plain') as string) ?? null
}

export function hasApiKey(): boolean {
  if (!store) return false
  return !!(store.get('openai_api_key') || store.get('openai_api_key_plain'))
}

// History persistence
export function getHistory(): any[] {
  return (store?.get('transcription_history', []) as any[]) ?? []
}

export function setHistory(history: any[]) {
  store?.set('transcription_history', history)
}

// Snippets persistence
export function getSnippets(): any[] {
  return (store?.get('snippets', []) as any[]) ?? []
}

export function setSnippets(snippets: any[]) {
  store?.set('snippets', snippets)
}
