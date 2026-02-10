import { safeStorage } from 'electron'
import Store from 'electron-store'

let store: Store | null = null

export type LicenseStatus = 'none' | 'active' | 'expired' | 'invalid'

export interface AppSettings {
  holdHotkey: string
  toggleHotkey: string
  promptHotkey: string
  language: string
  theme: 'dark' | 'light'
  autoCopy: boolean
  cleanupEnabled: boolean
  audioInputDeviceId: string
  sttProvider: 'local' | 'groq' | 'openai' | 'deepgram'
  localModelSize: 'tiny' | 'base' | 'small' | 'medium'
  cleanupProvider: 'groq' | 'openai' | 'none'
  codeMode: boolean
  licenseKey: string
  licenseStatus: LicenseStatus
  licensePlan: string
  licenseExpiresAt: string
  trialStartedAt: number
  lastLicenseCheck: number
  userEmail: string
}

const defaults: AppSettings = {
  holdHotkey: 'Alt',
  toggleHotkey: '',
  promptHotkey: '',
  language: 'en',
  theme: 'dark',
  autoCopy: true,
  cleanupEnabled: true,
  audioInputDeviceId: 'default',
  sttProvider: 'openai',
  localModelSize: 'base',
  cleanupProvider: 'openai',
  codeMode: false,
  licenseKey: '',
  licenseStatus: 'none',
  licensePlan: '',
  licenseExpiresAt: '',
  trialStartedAt: 0,
  lastLicenseCheck: 0,
  userEmail: '',
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
    // Initialize trial on first launch
    const trialStarted = store.get('trialStartedAt', 0) as number
    if (!trialStarted) {
      store.set('trialStartedAt', Date.now())
      console.log('[VoiceFlow] Trial period started')
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
    promptHotkey: store.get('promptHotkey', defaults.promptHotkey) as string,
    language: store.get('language', defaults.language) as string,
    theme: store.get('theme', defaults.theme) as 'dark' | 'light',
    autoCopy: store.get('autoCopy', defaults.autoCopy) as boolean,
    cleanupEnabled: store.get('cleanupEnabled', defaults.cleanupEnabled) as boolean,
    audioInputDeviceId: store.get('audioInputDeviceId', defaults.audioInputDeviceId) as string,
    sttProvider: store.get('sttProvider', defaults.sttProvider) as AppSettings['sttProvider'],
    localModelSize: store.get('localModelSize', defaults.localModelSize) as AppSettings['localModelSize'],
    cleanupProvider: store.get('cleanupProvider', defaults.cleanupProvider) as AppSettings['cleanupProvider'],
    codeMode: store.get('codeMode', defaults.codeMode) as boolean,
    licenseKey: store.get('licenseKey', defaults.licenseKey) as string,
    licenseStatus: store.get('licenseStatus', defaults.licenseStatus) as LicenseStatus,
    licensePlan: store.get('licensePlan', defaults.licensePlan) as string,
    licenseExpiresAt: store.get('licenseExpiresAt', defaults.licenseExpiresAt) as string,
    trialStartedAt: store.get('trialStartedAt', defaults.trialStartedAt) as number,
    lastLicenseCheck: store.get('lastLicenseCheck', defaults.lastLicenseCheck) as number,
    userEmail: store.get('userEmail', defaults.userEmail) as string,
  }
}

// License helpers
export function getLicenseInfo() {
  return {
    licenseKey: getSetting('licenseKey'),
    licenseStatus: getSetting('licenseStatus'),
    licensePlan: getSetting('licensePlan'),
    licenseExpiresAt: getSetting('licenseExpiresAt'),
    trialStartedAt: getSetting('trialStartedAt'),
    lastLicenseCheck: getSetting('lastLicenseCheck'),
    userEmail: getSetting('userEmail'),
  }
}

export function saveLicenseResult(result: {
  licenseKey: string
  status: LicenseStatus
  plan: string
  expiresAt: string
}) {
  setSetting('licenseKey', result.licenseKey)
  setSetting('licenseStatus', result.status)
  setSetting('licensePlan', result.plan)
  setSetting('licenseExpiresAt', result.expiresAt)
  setSetting('lastLicenseCheck', Date.now())
}

export function clearLicense() {
  setSetting('licenseKey', '')
  setSetting('licenseStatus', 'none')
  setSetting('licensePlan', '')
  setSetting('licenseExpiresAt', '')
  setSetting('lastLicenseCheck', 0)
  setSetting('userEmail', '')
}

export function getTrialInfo(): { daysLeft: number; isExpired: boolean } {
  const trialStartedAt = getSetting('trialStartedAt')
  if (!trialStartedAt) {
    return { daysLeft: 30, isExpired: false }
  }
  const elapsed = Date.now() - trialStartedAt
  const daysUsed = elapsed / (1000 * 60 * 60 * 24)
  const daysLeft = Math.max(0, Math.ceil(30 - daysUsed))
  return { daysLeft, isExpired: daysLeft <= 0 }
}

export function ensureTrialStarted() {
  if (!store) return
  const existing = store.get('trialStartedAt', 0) as number
  if (!existing) {
    store.set('trialStartedAt', Date.now())
    console.log('[VoiceFlow] Trial started')
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

export function deleteApiKey(provider: string = 'openai'): boolean {
  if (!store) return false
  const storeKey = `api_key_${provider}`
  const plainKey = `api_key_${provider}_plain`
  store.delete(storeKey)
  store.delete(plainKey)
  if (provider === 'openai') {
    store.delete('openai_api_key')
    store.delete('openai_api_key_plain')
  }
  console.log(`[VoiceFlow] API key deleted for ${provider}`)
  return true
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
