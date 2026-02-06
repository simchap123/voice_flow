import { useState, useEffect } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { OverlayShell } from '@/components/layout/OverlayShell'
import { DictationPage } from '@/pages/DictationPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SnippetsPage } from '@/pages/SnippetsPage'
import { SettingsContext, useSettingsProvider } from '@/hooks/useSettings'

function MainApp() {
  const [currentPage, setCurrentPage] = useState('dictation')

  const renderPage = () => {
    switch (currentPage) {
      case 'dictation': return <DictationPage />
      case 'history': return <HistoryPage />
      case 'settings': return <SettingsPage />
      case 'snippets': return <SnippetsPage />
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
    </div>
  )
}

function OverlayApp() {
  return (
    <div className="h-screen w-screen">
      <OverlayShell />
    </div>
  )
}

export function App() {
  const settingsValue = useSettingsProvider()

  // Detect if we're the overlay window (loaded with #/overlay hash)
  const isOverlay = window.location.hash === '#/overlay'

  return (
    <SettingsContext.Provider value={settingsValue}>
      {isOverlay ? <OverlayApp /> : <MainApp />}
    </SettingsContext.Provider>
  )
}
