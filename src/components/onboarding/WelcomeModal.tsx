import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface WelcomeModalProps {
  onComplete: () => void
}

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [activated, setActivated] = useState(false)

  async function handleActivate() {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@') || !window.electronAPI) return

    setChecking(true)
    setError('')

    try {
      const result = await window.electronAPI.validateByEmail(trimmed)
      if (result.valid) {
        setActivated(true)
        // Brief pause to show success before advancing
        setTimeout(() => setStep(2), 800)
      } else {
        setError(result.error || 'No active license or trial found for this email.')
      }
    } catch {
      setError('Connection failed. Check your internet and try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-border/50 bg-background shadow-2xl overflow-hidden">
        {/* Step indicators */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-6 pt-2">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Welcome to VoxGen</h2>
                <p className="text-sm text-muted-foreground">
                  AI dictation that works everywhere. Press a hotkey, speak, and polished text appears.
                </p>
              </div>

              <div className="space-y-3">
                <Feature
                  icon={<MicIcon />}
                  title="System-wide dictation"
                  desc="Works in any app — Slack, Word, VS Code, Gmail"
                />
                <Feature
                  icon={<SparklesIcon />}
                  title="AI-powered cleanup"
                  desc="Removes filler words, fixes grammar, formats text"
                />
                <Feature
                  icon={<ZapIcon />}
                  title="Content generation"
                  desc="Say 'write me an email about...' for full AI generation"
                />
              </div>

              <Button onClick={() => setStep(1)} className="w-full">
                Get Started
              </Button>
            </div>
          )}

          {/* Step 1: Activate Trial */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Activate your free trial</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email to start a 30-day free trial. No credit card required — just start dictating.
                </p>
              </div>

              {activated ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15">
                    <CheckIcon />
                  </div>
                  <p className="text-sm font-medium text-green-400">Trial activated!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError('') }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleActivate() }}
                        className="text-sm"
                        autoFocus
                      />
                      <Button
                        onClick={handleActivate}
                        disabled={!email.trim() || !email.includes('@') || checking}
                        className="shrink-0"
                      >
                        {checking ? 'Checking...' : 'Activate'}
                      </Button>
                    </div>
                    {error && <p className="text-xs text-red-400">{error}</p>}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Already have a license? Enter the email you used to purchase.
                  </p>
                </>
              )}

              {!activated && (
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now
                  </button>
                  <p className="text-xs text-muted-foreground">
                    or use your own API key in Settings
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: How to Use */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">How to use VoxGen</h2>
                <p className="text-sm text-muted-foreground">
                  Three simple steps to start dictating.
                </p>
              </div>

              <div className="space-y-4">
                <HowToStep
                  num={1}
                  title="Press your hotkey"
                  desc={<>Hold <kbd className="bg-primary/15 px-1.5 py-0.5 rounded text-[11px] font-semibold text-primary">Alt</kbd> from any app</>}
                />
                <HowToStep
                  num={2}
                  title="Speak naturally"
                  desc="VoxGen records and transcribes in real time"
                />
                <HowToStep
                  num={3}
                  title="Release to paste"
                  desc="Clean, polished text appears where your cursor was"
                />
              </div>

              <Button onClick={onComplete} className="w-full">
                Start Dictating
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

function HowToStep({ num, title, desc }: { num: number; title: string; desc: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-500 text-white text-xs font-bold">
        {num}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

// Inline SVG icons to avoid extra imports
function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-green-500">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
