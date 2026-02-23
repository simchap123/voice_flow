import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import type { AppSettings } from '@/types/settings'
import { defaultSettings } from '@/types/settings'
import { initSTTProvider } from '@/lib/stt/provider-factory'
import { initCleanupProvider } from '@/lib/cleanup/provider-factory'
import type { STTProviderType } from '@/lib/stt/types'
import type { CleanupProviderType } from '@/lib/cleanup/types'

const LS_SETTINGS_KEY = 'voxgen-settings'
const LS_API_KEY_PREFIX = 'voxgen-api-key'

interface SettingsContextValue {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  hasApiKey: boolean
  isManagedMode: boolean
  saveApiKey: (key: string, provider?: string) => Promise<{ success: boolean; error?: string }>
  isLoaded: boolean
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSetting: () => {},
  hasApiKey: false,
  isManagedMode: false,
  saveApiKey: async () => ({ success: false }),
  isLoaded: false,
})

// Initialize providers with their stored API keys
async function initProvidersWithKeys(sttType: STTProviderType, cleanupType: CleanupProviderType, isElectron: boolean) {
  const providersToInit = new Set<string>()
  if (sttType !== 'local' && sttType !== 'managed') providersToInit.add(sttType)
  if (cleanupType !== 'none' && cleanupType !== 'managed') providersToInit.add(cleanupType)

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

// Initialize managed providers with the user's email
function initManagedProviders(email: string) {
  try { initSTTProvider('managed', email) } catch {}
  try { initCleanupProvider('managed', email) } catch {}
}

// Check if managed mode should be active:
// User has email + (trial active or licensed) + no own API key for selected provider
async function checkManagedMode(
  settings: AppSettings,
  isElectron: boolean,
): Promise<{ managed: boolean; email: string }> {
  // Get user email
  let email = ''
  if (isElectron) {
    const allSettings = await window.electronAPI!.getSettings()
    email = allSettings?.userEmail || ''
  }

  if (!email) return { managed: false, email: '' }

  // Check if user has their own key for the selected STT provider
  if (settings.sttProvider === 'local') return { managed: false, email }

  let hasOwnKey = false
  if (isElectron) {
    hasOwnKey = await window.electronAPI!.hasApiKey(settings.sttProvider)
  } else {
    hasOwnKey = !!localStorage.getItem(`${LS_API_KEY_PREFIX}-${settings.sttProvider}`)
  }

  // If user has their own key, no need for managed mode
  if (hasOwnKey) return { managed: false, email }

  // User has email but no API key → use managed mode
  return { managed: true, email }
}

export function useSettingsProvider(): SettingsContextValue {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isManagedMode, setIsManagedMode] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const isElectron = !!window.electronAPI

  useEffect(() => {
    async function load() {
      let loadedSettings = defaultSettings
      let managedModeActive = false

      if (isElectron) {
        try {
          const stored = await window.electronAPI!.getSettings()
          loadedSettings = { ...defaultSettings, ...stored }
          setSettings(loadedSettings)

          // Check if managed mode should be active
          const { managed, email } = await checkManagedMode(loadedSettings, true)

          if (managed) {
            // Trial/licensed user with no own key → use managed providers
            managedModeActive = true
            setIsManagedMode(true)
            setHasApiKey(true)
            initManagedProviders(email)
          } else if (loadedSettings.sttProvider === 'local') {
            setHasApiKey(true)
          } else {
            const has = await window.electronAPI!.hasApiKey(loadedSettings.sttProvider)
            setHasApiKey(has)
          }
        } catch (err) {
          console.error('[VoxGen] Failed to load settings:', err)
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
          console.error('[VoxGen] Failed to load settings from localStorage:', err)
        }
      }

      // Initialize BYOK providers (only when not in managed mode)
      if (!managedModeActive) {
        await initProvidersWithKeys(loadedSettings.sttProvider, loadedSettings.cleanupProvider, isElectron)
      }

      if (loadedSettings.sttProvider === 'local') {
        const { getLocalWhisperProvider } = await import('@/lib/stt/provider-factory')
        const localProvider = getLocalWhisperProvider()
        localProvider?.setModelSize(loadedSettings.localModelSize)
        // Pre-load model in background so first dictation is instant
        localProvider?.loadModel().catch((err: any) => {
          console.warn('[VoxGen] Background model preload failed:', err?.message)
        })
      }

      setIsLoaded(true)
    }
    load()
  }, [isElectron])

  // Listen for settings changed in other windows (e.g. main window changes, overlay picks up)
  useEffect(() => {
    const cleanup = window.electronAPI?.onSettingChanged?.((key: string, value: any) => {
      setSettings(prev => ({ ...prev, [key]: value }))

      // If userEmail changed, re-check managed mode
      if (key === 'userEmail') {
        if (value) {
          initManagedProviders(value)
          setIsManagedMode(true)
          setHasApiKey(true)
        } else {
          // Email cleared (license:clear) — disable managed mode
          setIsManagedMode(false)
          setHasApiKey(false)
        }
      }
    })
    return () => cleanup?.()
  }, [])

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      if (!window.electronAPI) {
        try { localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(next)) } catch {}
      }
      return next
    })
    window.electronAPI?.setSetting(key, value)

    // Recalculate hasApiKey when STT provider changes
    if (key === 'sttProvider') {
      if (value === 'local') {
        setHasApiKey(true)
      } else if (isManagedMode) {
        setHasApiKey(true)
      } else if (window.electronAPI) {
        window.electronAPI.hasApiKey(value as string).then(has => setHasApiKey(has))
      }
    }
  }, [isManagedMode])

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
        console.error('[VoxGen] Failed to save API key:', err)
        return { success: false, error: 'Failed to save API key to secure storage.' }
      }
    } else {
      try { localStorage.setItem(`${LS_API_KEY_PREFIX}-${provider}`, key) } catch {}
    }

    // Initialize the providers with the new key
    try { initSTTProvider(provider as STTProviderType, key) } catch {}
    try { initCleanupProvider(provider as CleanupProviderType, key) } catch {}

    // Switch off managed mode since user now has their own key
    setIsManagedMode(false)
    setHasApiKey(true)
    return { success: true }
  }, [])

  return { settings, updateSetting, hasApiKey, isManagedMode, saveApiKey, isLoaded }
}

export function useSettings() {
  return useContext(SettingsContext)
}
