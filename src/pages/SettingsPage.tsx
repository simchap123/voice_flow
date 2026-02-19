import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SettingsNav, type SettingsSection } from '@/components/settings/SettingsNav'
import { RecordingSection } from '@/components/settings/RecordingSection'
import { AIProcessingSection } from '@/components/settings/AIProcessingSection'
import { PromptsSection } from '@/components/settings/PromptsSection'
import { PowerModesSection } from '@/components/settings/PowerModesSection'
import { AccountSection } from '@/components/settings/AccountSection'

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('recording')

  const renderSection = () => {
    switch (activeSection) {
      case 'recording': return <RecordingSection />
      case 'ai-processing': return <AIProcessingSection />
      case 'prompts': return <PromptsSection />
      case 'power-modes': return <PowerModesSection />
      case 'account': return <AccountSection />
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
