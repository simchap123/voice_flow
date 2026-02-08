import { safeStorage } from 'electron'
import Store from 'electron-store'

let store: Store | null = null

export interface AppSettings {
  holdHotkey: string
  toggleHotkey: string
  language: string
  theme: 'dark' | 'light'
  autoCopy: boolean
  cleanupEnabled: boolean
  audioInputDeviceId: string
  sttProvider: 'local' | 'groq' | 'openai' | 'deepgram'
  localModelSize: 'tiny' | 'base' | 'small' | 'medium'
  cleanupProvider: 'groq' | 'openai' | 'none'
}

const defaults: AppSettings = {
  holdHotkey: 'Alt',
  toggleHotkey: '',
  language: 'en',
  theme: 'dark',
  autoCopy: true,
  cleanupEnabled: true,
  audioInputDeviceId: 'default',
  sttProvider: 'openai',
  localModelSize: 'base',
  cleanupProvider: 'openai',
}

export function initStore() {
  try {
    store = new Store({
      defaults,
      name: 'voiceflow-settings',
    })
    console.log('[VoiceFlow] Store initialized successfully at:', (store as any).path)

    // Migrate old hotkey/hotkeyMode to holdHotkey/toggleHotkey
    const oldHotkey = store.get('hotkey') as string | undefined
    const oldMode = store.get('hotkeyMode') as string | undefined
    if (oldHotkey) {
      if (oldMode === 'toggle') {
        store.set('toggleHotkey', oldHotkey)
        store.set('holdHotkey', '')
      } else {
        store.set('holdHotkey', oldHotkey)
        store.set('toggleHotkey', '')
      }
      store.delete('hotkey')
      store.delete('hotkeyMode')
      console.log(`[VoiceFlow] Migrated hotkey "${oldHotkey}" (mode: ${oldMode}) to new format`)
    }
  } catch (err) {
    console.error('[VoiceFlow] Failed to init store:', err)
  }
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
    holdHotkey: store.get('holdHotkey', defaults.holdHotkey) as string,
    toggleHotkey: store.get('toggleHotkey', defaults.toggleHotkey) as string,
    language: store.get('language', defaults.language) as string,
    theme: store.get('theme', defaults.theme) as 'dark' | 'light',
    autoCopy: store.get('autoCopy', defaults.autoCopy) as boolean,
    cleanupEnabled: store.get('cleanupEnabled', defaults.cleanupEnabled) as boolean,
    audioInputDeviceId: store.get('audioInputDeviceId', defaults.audioInputDeviceId) as string,
    sttProvider: store.get('sttProvider', defaults.sttProvider) as AppSettings['sttProvider'],
    localModelSize: store.get('localModelSize', defaults.localModelSize) as AppSettings['localModelSize'],
    cleanupProvider: store.get('cleanupProvider', defaults.cleanupProvider) as AppSettings['cleanupProvider'],
  }
}

// Secure API key storage — supports multiple providers (openai, groq, deepgram)
export function saveApiKey(key: string, provider: string = 'openai'): boolean {
  console.log(`[VoiceFlow] saveApiKey called for ${provider}, store exists:`, !!store, 'encryption available:', safeStorage.isEncryptionAvailable())
  if (!store) {
    console.error('[VoiceFlow] Store not initialized!')
    return false
  }

  const storeKey = `api_key_${provider}`
  const plainKey = `api_key_${provider}_plain`

  if (!safeStorage.isEncryptionAvailable()) {
    store.set(plainKey, key)
    console.log(`[VoiceFlow] API key saved for ${provider} (plaintext fallback)`)
    return false
  }

  const encrypted = safeStorage.encryptString(key)
  store.set(storeKey, encrypted.toString('base64'))
  store.delete(plainKey)
  console.log(`[VoiceFlow] API key saved for ${provider} (encrypted)`)
  return true
}

export function getApiKey(provider: string = 'openai'): string | null {
  if (!store) return null

  const storeKey = `api_key_${provider}`
  const plainKey = `api_key_${provider}_plain`

  // Also check legacy key location for backwards compat with v1
  const legacyKey = provider === 'openai' ? 'openai_api_key' : null
  const legacyPlainKey = provider === 'openai' ? 'openai_api_key_plain' : null

  for (const key of [storeKey, legacyKey].filter(Boolean)) {
    const encrypted = store.get(key!) as string | undefined
    if (encrypted && safeStorage.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(encrypted, 'base64')
        return safeStorage.decryptString(buffer)
      } catch {
        continue
      }
    }
  }

  for (const key of [plainKey, legacyPlainKey].filter(Boolean)) {
    const plain = store.get(key!) as string | undefined
    if (plain) return plain
  }

  return null
}

export function hasApiKey(provider: string = 'openai'): boolean {
  if (!store) return false
  const storeKey = `api_key_${provider}`
  const plainKey = `api_key_${provider}_plain`
  if (provider === 'openai') {
    return !!(store.get(storeKey) || store.get(plainKey) || store.get('openai_api_key') || store.get('openai_api_key_plain'))
  }
  return !!(store.get(storeKey) || store.get(plainKey))
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
