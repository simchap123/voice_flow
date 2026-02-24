import { ScrollArea } from '@/components/ui/scroll-area'
import { PromptsSection } from '@/components/settings/PromptsSection'

export function AIPromptsPage() {
  return (
    <ScrollArea className="h-full">
      <div className="page-enter p-6 space-y-3 max-w-[560px]">
        <div className="mb-2">
          <h2 className="text-[16px] font-bold tracking-tight">AI Prompts</h2>
          <p className="text-[11px] text-muted-foreground/50">
            Prompts shape how AI processes your speech. The active prompt applies to both dictation cleanup and content generation.
          </p>
        </div>

        <PromptsSection />
      </div>
    </ScrollArea>
  )
}
