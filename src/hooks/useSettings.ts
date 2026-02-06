import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import type { AppSettings } from '@/types/settings'
import { defaultSettings } from '@/types/settings'
import { initOpenAI } from '@/lib/openai'
import OpenAI from 'openai'

const LS_SETTINGS_KEY = 'voiceflow-settings'
const LS_API_KEY = 'voiceflow-api-key'

interface SettingsContextValue {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  hasApiKey: boolean
  saveApiKey: (key: string) => Promise<{ success: boolean; error?: string }>
  isLoaded: boolean
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSetting: () => {},
  hasApiKey: false,
  saveApiKey: async () => ({ success: false }),
  isLoaded: false,
})

export function useSettingsProvider(): SettingsContextValue {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const isElectron = !!window.electronAPI

  // Load settings and init OpenAI on mount
  useEffect(() => {
    async function load() {
      if (isElectron) {
        try {
          const stored = await window.electronAPI!.getSettings()
          setSettings({ ...defaultSettings, ...stored })

          const hasKey = await window.electronAPI!.hasApiKey()
          setHasApiKey(hasKey)

          if (hasKey) {
            const apiKey = await window.electronAPI!.getApiKey()
            if (apiKey) initOpenAI(apiKey)
          }
        } catch (err) {
          console.error('[VoiceFlow] Failed to load settings:', err)
        }
      } else {
        // Web mode: load from localStorage
        try {
          const stored = localStorage.getItem(LS_SETTINGS_KEY)
          if (stored) {
            setSettings({ ...defaultSettings, ...JSON.parse(stored) })
          }
          const savedKey = localStorage.getItem(LS_API_KEY)
          if (savedKey) {
            setHasApiKey(true)
            initOpenAI(savedKey)
          }
        } catch (err) {
          console.error('[VoiceFlow] Failed to load settings from localStorage:', err)
        }
      }
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

  const saveApiKey = useCallback(async (key: string): Promise<{ success: boolean; error?: string }> => {
    // Basic format check
    if (!key.startsWith('sk-')) {
      return { success: false, error: 'Invalid API key format. Keys start with "sk-".' }
    }

    // Validate with a test API call
    try {
      const testClient = new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true,
      })
      await testClient.models.list()
    } catch (err: any) {
      const msg = err?.status === 401
        ? 'Invalid API key. Please check and try again.'
        : err?.message ?? 'Failed to validate API key.'
      return { success: false, error: msg }
    }

    // Key is valid, save it
    if (window.electronAPI) {
      try {
        await window.electronAPI.saveApiKey(key)
      } catch (err) {
        return { success: false, error: 'Failed to save API key to secure storage.' }
      }
    } else {
      // Web mode: save to localStorage (not encrypted, but functional)
      try { localStorage.setItem(LS_API_KEY, key) } catch {}
    }

    setHasApiKey(true)
    initOpenAI(key)
    return { success: true }
  }, [])

  return { settings, updateSetting, hasApiKey, saveApiKey, isLoaded }
}

export function useSettings() {
  return useContext(SettingsContext)
}
