import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlanPicker } from '@/components/settings/plan-picker'

interface WelcomeModalProps {
  onComplete: () => void
}

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [activated, setActivated] = useState(false)
  const [showPlanPicker, setShowPlanPicker] = useState(false)

  async function handleActivate() {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@') || !window.electronAPI) return

    setChecking(true)
    setError('')

    try {
      const result = await window.electronAPI.validateByEmail(trimmed)
      if (result.valid) {
        setActivated(true)
        setTimeout(() => setStep(2), 800)
      } else {
        const errMsg = result.error || 'No active license or trial found for this email.'
        setError(errMsg)
        if (errMsg === 'No license found for this email') {
          setShowPlanPicker(true)
        }
      }
    } catch {
      setError('Connection failed. Check your internet and try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-border/30 bg-background/95 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Step indicators */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-muted/50'
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-6 pt-3">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <MicIcon className="text-primary" />
                  </div>
                  <span className="text-lg font-semibold tracking-tight">VoxGen</span>
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Welcome to VoxGen</h2>
                <p className="text-[13px] text-muted-foreground/70">
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

              <Button onClick={() => setStep(1)} className="w-full rounded-xl h-10">
                Get Started
              </Button>
            </div>
          )}

          {/* Step 1: Activate Trial */}
          {step === 1 && (
            <div className="space-y-6">
              {showPlanPicker ? (
                <>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">Choose a plan</h2>
                    <p className="text-[13px] text-muted-foreground/70">
                      No license found for <span className="font-medium text-foreground">{email}</span>. Pick a plan to get started.
                    </p>
                  </div>
                  <PlanPicker
                    email={email.trim().toLowerCase()}
                    onBack={() => {
                      setShowPlanPicker(false)
                      setError('')
                    }}
                    onActivated={() => {
                      setShowPlanPicker(false)
                      setActivated(true)
                      setTimeout(() => setStep(2), 800)
                    }}
                  />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">Activate your free trial</h2>
                    <p className="text-[13px] text-muted-foreground/70">
                      Enter your email to start a 30-day free trial. No credit card required.
                    </p>
                  </div>

                  {activated ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                        <CheckIcon />
                      </div>
                      <p className="text-[13px] font-medium text-primary">Trial activated!</p>
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
                            className="text-[13px] rounded-xl"
                            autoFocus
                          />
                          <Button
                            onClick={handleActivate}
                            disabled={!email.trim() || !email.includes('@') || checking}
                            className="shrink-0 rounded-xl"
                          >
                            {checking ? 'Checking...' : 'Activate'}
                          </Button>
                        </div>
                        {error && <p className="text-[11px] text-red-400">{error}</p>}
                      </div>

                      <p className="text-[11px] text-muted-foreground/50">
                        Already have a license? Enter the email you used to purchase.
                      </p>
                    </>
                  )}

                  {!activated && (
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setStep(2)}
                        className="text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        Skip for now
                      </button>
                      <p className="text-[11px] text-muted-foreground/50">
                        or use your own API key in Settings
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: How to Use */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">How to use VoxGen</h2>
                <p className="text-[13px] text-muted-foreground/70">
                  Three simple steps to start dictating.
                </p>
              </div>

              <div className="space-y-4">
                <HowToStep
                  num={1}
                  title="Press your hotkey"
                  desc={<>Hold <kbd className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[11px] font-semibold">Alt</kbd> from any app</>}
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

              <Button onClick={onComplete} className="w-full rounded-xl h-10">
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
      <div className="flex-shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground/60">{desc}</p>
      </div>
    </div>
  )
}

function HowToStep({ num, title, desc }: { num: number; title: string; desc: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white text-[12px] font-bold">
        {num}
      </div>
      <div>
        <p className="text-[13px] font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground/60">{desc}</p>
      </div>
    </div>
  )
}

function MicIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4.5 w-4.5 ${className}`}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
