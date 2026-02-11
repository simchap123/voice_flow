import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useRef } from 'react'

export function ThreeStepsPage() {
  const step3Ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = step3Ref.current
    if (!el) return

    const lines = [
      'We should move the launch date to next Thursday to give the design team more time.',
      'Action item: Sarah will send the updated budget to finance by end of day.',
      'The client loved the new dashboard but requested a dark mode option.',
    ]
    let lineIdx = 0
    let charIdx = 0
    let deleting = false
    let timer: ReturnType<typeof setTimeout>

    function tick() {
      if (!el) return
      const current = lines[lineIdx]
      if (!deleting) {
        charIdx = Math.min(charIdx + 1, current.length)
        el.textContent = current.substring(0, charIdx)
        if (charIdx >= current.length) {
          timer = setTimeout(() => { deleting = true; tick() }, 3000)
          return
        }
        timer = setTimeout(tick, current[charIdx] === ' ' ? 80 : 30 + Math.random() * 40)
      } else {
        charIdx = Math.max(charIdx - 4, 0)
        el.textContent = current.substring(0, charIdx)
        if (charIdx <= 0) {
          deleting = false
          lineIdx = (lineIdx + 1) % lines.length
          timer = setTimeout(tick, 600)
          return
        }
        timer = setTimeout(tick, 15)
      }
    }
    timer = setTimeout(tick, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-12 px-6 py-8 max-w-lg mx-auto">

        {/* Step 1: Download & Install */}
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            1
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70 mb-1">Quick setup</p>
              <h3 className="text-base font-semibold">Download & Install</h3>
              <p className="text-sm text-muted-foreground mt-1">Download the installer, double-click to run, and add your API key. Dictating in under 30 seconds.</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-lg">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-b border-border/50">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] text-muted-foreground/50">Downloads</span>
              </div>
              <div className="p-5 flex flex-col items-center gap-3 relative min-h-[140px]">
                <div className="dl-phase w-full flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center animate-[dl-bounce_12s_ease-in-out_infinite]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </div>
                  <span className="text-xs font-medium">VoxGen-Setup.exe</span>
                  <div className="w-full max-w-[200px] h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full animate-[dl-progress_12s_ease-in-out_infinite]" />
                  </div>
                  <span className="text-[11px] text-muted-foreground animate-[dl-status_12s_ease-in-out_infinite]">Downloading...</span>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 animate-[dl-complete_12s_ease-in-out_infinite]">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="text-xs font-medium text-green-500">Installed & ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Press Your Hotkey */}
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            2
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70 mb-1">From any app</p>
              <h3 className="text-base font-semibold">Press Your Hotkey</h3>
              <p className="text-sm text-muted-foreground mt-1">From Slack, VS Code, Word, Gmail — anywhere. Hold <kbd className="bg-primary/15 px-1.5 py-0.5 rounded text-[11px] font-semibold text-primary">Alt</kbd> and start speaking.</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-lg">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-b border-border/50">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] text-muted-foreground/50">Any App</span>
              </div>
              <div className="p-5 flex flex-col items-center gap-4 min-h-[140px] justify-center">
                {/* Mini keyboard */}
                <div className="flex gap-1 items-center">
                  <div className="h-8 px-2 bg-muted/30 border border-border/50 rounded text-[10px] font-semibold text-muted-foreground flex items-center">Tab</div>
                  <div className="h-8 px-2 bg-muted/30 border border-border/50 rounded text-[10px] font-semibold text-muted-foreground flex items-center">Ctrl</div>
                  <div className="h-8 px-3 bg-primary/10 border border-primary/20 rounded text-[10px] font-semibold text-primary flex items-center animate-[hk-press_8s_ease-in-out_infinite]">Alt</div>
                  <div className="h-8 w-16 bg-muted/30 border border-border/50 rounded flex items-center" />
                  <div className="h-8 px-2 bg-muted/30 border border-border/50 rounded text-[10px] font-semibold text-muted-foreground flex items-center">Alt</div>
                  <div className="h-8 px-2 bg-muted/30 border border-border/50 rounded text-[10px] font-semibold text-muted-foreground flex items-center">Ctrl</div>
                </div>
                {/* Recording overlay pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/80 border border-white/10 rounded-full animate-[hk-overlay_8s_ease-in-out_infinite]">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-white/70 font-medium">Recording</span>
                  <div className="flex gap-[2px] items-center h-3">
                    {[0, 0.1, 0.2, 0.15, 0.25].map((d, i) => (
                      <div key={i} className="w-[2px] bg-primary/80 rounded-sm" style={{ animation: `hk-wave 0.8s ease-in-out ${d}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Clean Text Appears */}
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            3
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70 mb-1">Instant</p>
              <h3 className="text-base font-semibold">Clean Text Appears</h3>
              <p className="text-sm text-muted-foreground mt-1">VoxGen transcribes, removes filler words, fixes grammar, and pastes polished text right where your cursor was.</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-lg">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-b border-border/50">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] text-muted-foreground/50">Document</span>
              </div>
              <div className="p-5 min-h-[140px]">
                {/* Fake toolbar */}
                <div className="flex items-center gap-2 pb-2.5 border-b border-border/30 mb-3">
                  <div className="w-4 h-4 bg-muted/30 rounded" />
                  <div className="w-4 h-4 bg-muted/30 rounded" />
                  <div className="w-4 h-4 bg-muted/30 rounded" />
                  <div className="w-px h-3 bg-border/50" />
                  <div className="w-4 h-4 bg-muted/30 rounded" />
                  <span className="ml-auto text-[9px] text-muted-foreground/40">Draft</span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground/40">Meeting Notes — Q1 Review</p>
                  <p className="text-xs text-muted-foreground/25">The team discussed progress on...</p>
                  <p className="text-xs mt-1">
                    <span ref={step3Ref} className="bg-primary/5 rounded px-0.5" />
                    <span className="inline-block w-[2px] h-3.5 bg-primary align-text-bottom animate-[ta-blink_1s_step-end_infinite]" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes dl-bounce {
          0%, 8% { transform: translateY(0); }
          4% { transform: translateY(-4px); }
          12%, 100% { transform: translateY(0); }
        }
        @keyframes dl-progress {
          0% { width: 0%; }
          2% { width: 8%; }
          15% { width: 45%; }
          30% { width: 78%; }
          40% { width: 100%; }
          50%, 100% { width: 100%; }
        }
        @keyframes dl-status {
          0%, 39% { opacity: 1; }
          40% { opacity: 0; }
          42% { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes dl-complete {
          0%, 39% { opacity: 0; pointer-events: none; }
          42% { opacity: 1; }
          90% { opacity: 1; }
          95%, 100% { opacity: 0; }
        }
        @keyframes hk-press {
          0%, 10% { transform: translateY(0); background: hsl(var(--primary) / 0.1); box-shadow: none; }
          15% { transform: translateY(2px); background: hsl(var(--primary) / 0.25); box-shadow: 0 0 16px hsl(var(--primary) / 0.3); }
          70% { transform: translateY(2px); background: hsl(var(--primary) / 0.25); box-shadow: 0 0 16px hsl(var(--primary) / 0.3); }
          80%, 100% { transform: translateY(0); background: hsl(var(--primary) / 0.1); box-shadow: none; }
        }
        @keyframes hk-overlay {
          0%, 14% { opacity: 0; transform: scale(0.8); }
          18% { opacity: 1; transform: scale(1); }
          70% { opacity: 1; transform: scale(1); }
          78%, 100% { opacity: 0; transform: scale(0.8); }
        }
        @keyframes hk-wave {
          0%, 100% { height: 3px; }
          50% { height: 11px; }
        }
        @keyframes ta-blink {
          50% { opacity: 0; }
        }
      `}</style>
    </ScrollArea>
  )
}
