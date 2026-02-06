import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import type { AppSettings } from '@/types/settings'
import { defaultSettings } from '@/types/settings'
import { initOpenAI } from '@/lib/openai'

interface SettingsContextValue {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  hasApiKey: boolean
  saveApiKey: (key: string) => Promise<void>
  isLoaded: boolean
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSetting: () => {},
  hasApiKey: false,
  saveApiKey: async () => {},
  isLoaded: false,
})

export function useSettingsProvider(): SettingsContextValue {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings and init OpenAI on mount
  useEffect(() => {
    async function load() {
      if (window.electronAPI) {
        const stored = await window.electronAPI.getSettings()
        setSettings({ ...defaultSettings, ...stored })

        const hasKey = await window.electronAPI.hasApiKey()
        setHasApiKey(hasKey)

        if (hasKey) {
          const apiKey = await window.electronAPI.getApiKey()
          if (apiKey) initOpenAI(apiKey)
        }
      }
      setIsLoaded(true)
    }
    load()
  }, [])

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    window.electronAPI?.setSetting(key, value)
  }, [])

  const saveApiKey = useCallback(async (key: string) => {
    if (window.electronAPI) {
      await window.electronAPI.saveApiKey(key)
      setHasApiKey(true)
      initOpenAI(key)
    }
  }, [])

  return { settings, updateSetting, hasApiKey, saveApiKey, isLoaded }
}

export function useSettings() {
  return useContext(SettingsContext)
}
