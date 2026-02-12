import { useState, useEffect } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { OverlayShell } from '@/components/layout/OverlayShell'
import { DictationPage } from '@/pages/DictationPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SnippetsPage } from '@/pages/SnippetsPage'
import { WhatsNewPage } from '@/pages/WhatsNewPage'
import { SettingsContext, useSettingsProvider, useSettings } from '@/hooks/useSettings'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast'
import { useToastProvider } from '@/hooks/useToast'
import { WelcomeModal } from '@/components/onboarding/WelcomeModal'

function MainApp() {
  const [currentPage, setCurrentPage] = useState('dictation')
  const { settings, updateSetting, isLoaded } = useSettings()

  const showOnboarding = isLoaded && !settings.onboardingComplete

  function handleOnboardingComplete() {
    updateSetting('onboardingComplete', true)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dictation': return <DictationPage />
      case 'history': return <HistoryPage />
      case 'settings': return <SettingsPage />
      case 'snippets': return <SnippetsPage />
      case 'whats-new': return <WhatsNewPage />
      default: return <DictationPage />
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
