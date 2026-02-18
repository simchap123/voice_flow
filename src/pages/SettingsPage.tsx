import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SettingsNav, type SettingsSection } from '@/components/settings/SettingsNav'
import { GeneralSection } from '@/components/settings/GeneralSection'
import { ProvidersSection } from '@/components/settings/ProvidersSection'
import { EnhancementSection } from '@/components/settings/EnhancementSection'
import { PromptsSection } from '@/components/settings/PromptsSection'
import { PowerModesSection } from '@/components/settings/PowerModesSection'
import { AccountSection } from '@/components/settings/AccountSection'
import { AboutSection } from '@/components/settings/AboutSection'

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')

  const renderSection = () => {
    switch (activeSection) {
      case 'general': return <GeneralSection />
      case 'providers': return <ProvidersSection />
      case 'enhancement': return <EnhancementSection />
      case 'prompts': return <PromptsSection />
      case 'power-modes': return <PowerModesSection />
      case 'account': return <AccountSection />
      case 'about': return <AboutSection />
    }
  }

  return (
    <div className="flex h-full">
      <SettingsNav active={activeSection} onSelect={setActiveSection} />
      <ScrollArea className="flex-1">
        <div className="p-8">
          {renderSection()}
        </div>
      </ScrollArea>
    </div>
  )
}
