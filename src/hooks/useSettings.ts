import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import type { AppSettings } from '@/types/settings'
import { defaultSettings } from '@/types/settings'
import { initSTTProvider } from '@/lib/stt/provider-factory'
import { initCleanupProvider } from '@/lib/cleanup/provider-factory'
import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType } from '@/lib/cleanup/types'

const LS_SETTINGS_KEY = 'voiceflow-settings'
const LS_API_KEY_PREFIX = 'voiceflow-api-key'

interface SettingsContextValue {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  hasApiKey: boolean
  saveApiKey: (key: string, provider?: string) => Promise<{ success: boolean; error?: string }>
  isLoaded: boolean
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSetting: () => {},
  hasApiKey: false,
  saveApiKey: async () => ({ success: false }),
  isLoaded: false,
})

// Initialize providers with their stored API keys
async function initProvidersWithKeys(sttType: STTProviderType, cleanupType: CleanupProviderType, isElectron: boolean) {
  const providersToInit = new Set<string>()
  if (sttType !== 'local') providersToInit.add(sttType)
  if (cleanupType !== 'none') providersToInit.add(cleanupType)

  for (const provider of providersToInit) {
    let apiKey: string | null = null

    if (isElectron) {
      apiKey = await window.electronAPI!.getApiKey(provider)
    } else {
      apiKey = localStorage.getItem(`${LS_API_KEY_PREFIX}-${provider}`)
    }

    if (apiKey) {
      try {
        initSTTProvider(provider as STTProviderType, apiKey)
      } catch { /* provider might not support STT */ }
      try {
        initCleanupProvider(provider as CleanupProviderType, apiKey)
      } catch { /* provider might not support cleanup */ }
    }
  }
}

export function useSettingsProvider(): SettingsContextValue {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const isElectron = !!window.electronAPI

  useEffect(() => {
    async function load() {
      let loadedSettings = defaultSettings

      if (isElectron) {
        try {
          const stored = await window.electronAPI!.getSettings()
          loadedSettings = { ...defaultSettings, ...stored }
          setSettings(loadedSettings)

          // Check if the current STT provider has a key (or is local = no key needed)
          if (loadedSettings.sttProvider === 'local') {
            setHasApiKey(true)
          } else {
            const has = await window.electronAPI!.hasApiKey(loadedSettings.sttProvider)
            setHasApiKey(has)
          }
        } catch (err) {
          console.error('[VoiceFlow] Failed to load settings:', err)
        }
      } else {
        try {
          const stored = localStorage.getItem(LS_SETTINGS_KEY)
          if (stored) {
            loadedSettings = { ...defaultSettings, ...JSON.parse(stored) }
            setSettings(loadedSettings)
          }
          const savedKey = localStorage.getItem(`${LS_API_KEY_PREFIX}-${loadedSettings.sttProvider}`)
            || localStorage.getItem(`${LS_API_KEY_PREFIX}-openai`)
          if (savedKey || loadedSettings.sttProvider === 'local') {
            setHasApiKey(true)
          }
        } catch (err) {
          console.error('[VoiceFlow] Failed to load settings from localStorage:', err)
        }
      }

      await initProvidersWithKeys(loadedSettings.sttProvider, loadedSettings.cleanupProvider, isElectron)
      setIsLoaded(true)
    }
    load()
  }, [isElectron])

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      if (!window.electronAPI) {
        try { localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(next)) } catch {}
      }
      return next
    })
    window.electronAPI?.setSetting(key, value)
  }, [])

  const saveApiKey = useCallback(async (key: string, provider: string = 'openai'): Promise<{ success: boolean; error?: string }> => {
    // Validate key format based on provider
    if (provider === 'openai' && !key.startsWith('sk-')) {
      return { success: false, error: 'Invalid API key format. OpenAI keys start with "sk-".' }
    }
    if (provider === 'groq' && !key.startsWith('gsk_')) {
      return { success: false, error: 'Invalid API key format. Groq keys start with "gsk_".' }
    }

    // Save the key directly (no API validation call — avoids network/CORS failures in Electron)
    if (window.electronAPI) {
      try {
        await window.electronAPI.saveApiKey(key, provider)
      } catch (err) {
        console.error('[VoiceFlow] Failed to save API key:', err)
        return { success: false, error: 'Failed to save API key to secure storage.' }
      }
    } else {
      try { localStorage.setItem(`${LS_API_KEY_PREFIX}-${provider}`, key) } catch {}
    }

    // Initialize the providers with the new key
    try { initSTTProvider(provider as STTProviderType, key) } catch {}
    try { initCleanupProvider(provider as CleanupProviderType, key) } catch {}

    setHasApiKey(true)
    return { success: true }
  }, [])

  return { settings, updateSetting, hasApiKey, saveApiKey, isLoaded }
}

export function useSettings() {
  return useContext(SettingsContext)
}
