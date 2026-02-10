import { ScrollArea } from '@/components/ui/scroll-area'

export function ThreeStepsPage() {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col items-center justify-center px-6 py-8">
        <img
          src="/voxgen-3-steps.gif"
          alt="VoxGen in 3 steps: Download & Install, Press Your Hotkey, Text Appears"
          className="max-w-full rounded-xl shadow-2xl shadow-primary/10"
          draggable={false}
        />
      </div>
    </ScrollArea>
  )
}
