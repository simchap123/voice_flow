import { useState, useEffect } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { OverlayShell } from '@/components/layout/OverlayShell'
import { HistoryPage } from '@/pages/HistoryPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SnippetsPage } from '@/pages/SnippetsPage'
import { SettingsContext, useSettingsProvider, useSettings } from '@/hooks/useSettings'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast'
import { useToastProvider, toast } from '@/hooks/useToast'
import { WelcomeModal } from '@/components/onboarding/WelcomeModal'

function MainApp() {
  const [currentPage, setCurrentPage] = useState('history')
  const { settings, updateSetting, hasApiKey, isLoaded } = useSettings()

  const showOnboarding = isLoaded && !settings.onboardingComplete

  // Trial urgency warnings — show toast at 7, 3, 1 days left
  useEffect(() => {
    if (!isLoaded) return
    if (!window.electronAPI) return

    window.electronAPI.getLicenseInfo().then((info: any) => {
      // Skip if active license or BYOK user
      if (info.licenseStatus === 'active') return
      if (hasApiKey) return
      if (!info.trialStartedAt) return

      const elapsed = Date.now() - info.trialStartedAt
      const daysUsed = elapsed / (1000 * 60 * 60 * 24)
      const daysLeft = Math.max(0, Math.ceil(30 - daysUsed))

      if (daysLeft === 1) {
        toast({ title: 'Trial expires tomorrow!', description: 'Last day of your free trial. Upgrade now or add your own API key in Settings.', variant: 'error' })
      } else if (daysLeft <= 3) {
        toast({ title: `Trial expires in ${daysLeft} days`, description: 'Your free trial is almost over. Upgrade to keep using managed transcription.', variant: 'error' })
      } else if (daysLeft <= 7) {
        toast({ title: 'Trial ending soon', description: `Your free trial expires in ${daysLeft} days. Add your own API key or upgrade to Pro.` })
      }
    })
  }, [isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleOnboardingComplete() {
    updateSetting('onboardingComplete', true)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'history': return <HistoryPage />
      case 'settings': return <SettingsPage />
      case 'snippets': return <SnippetsPage />
      default: return <HistoryPage />
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
      {showOnboarding && <WelcomeModal onComplete={handleOnboardingComplete} />}
    </div>
  )
}

function OverlayApp() {
  useEffect(() => {
    // Override the bg-background applied by index.css so the overlay
    // window stays fully transparent (no dark rectangle behind the pill)
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
  }, [])

  return (
    <div className="h-screen w-screen">
      <OverlayShell />
    </div>
  )
}

export function App() {
  const settingsValue = useSettingsProvider()
  const { toasts, removeToast } = useToastProvider()

  // Detect if we're the overlay window (loaded with #/overlay hash)
  const isOverlay = window.location.hash === '#/overlay'

  return (
    <SettingsContext.Provider value={settingsValue}>
      <ToastProvider duration={4000}>
        {isOverlay ? <OverlayApp /> : <MainApp />}
        {toasts.map(t => (
          <Toast
            key={t.id}
            variant={t.variant}
            onOpenChange={(open) => { if (!open) removeToast(t.id) }}
          >
            <div>
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </SettingsContext.Provider>
  )
}
