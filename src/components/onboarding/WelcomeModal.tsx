import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlanPicker } from '@/components/settings/plan-picker'
import { HotkeyRecorder } from '@/components/settings/HotkeyRecorder'
import { useSettings } from '@/hooks/useSettings'
import { ChevronDown, ChevronUp } from 'lucide-react'

const HOTKEY_DISPLAY: Record<string, string> = {
  RightAlt: 'Right Alt',
  LeftAlt: 'Left Alt',
  RightControl: 'Right Ctrl',
  LeftControl: 'Left Ctrl',
  RightShift: 'Right Shift',
  LeftShift: 'Left Shift',
}

function displayHotkeyName(hotkey: string): string {
  return HOTKEY_DISPLAY[hotkey] || hotkey
}

interface WelcomeModalProps {
  onComplete: () => void
}

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [activated, setActivated] = useState(false)
  const [showPurchaseSection, setShowPurchaseSection] = useState(false)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState(30)
  const { settings, updateSetting } = useSettings()

  useEffect(() => {
    async function loadTrialInfo() {
      if (!window.electronAPI) return
      try {
        const info = await window.electronAPI.getLicenseInfo()
        if (info.trialStartedAt) {
          const elapsed = Date.now() - info.trialStartedAt
          const daysUsed = elapsed / (1000 * 60 * 60 * 24)
          setTrialDaysLeft(Math.max(0, Math.floor(30 - daysUsed)))
        }
      } catch {}
    }
    loadTrialInfo()
  }, [])

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
          {[0, 1, 2, 3].map((i) => (
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

          {/* Step 1: Trial Active */}
          {step === 1 && (
            <div className="space-y-5">
              {showPlanPicker ? (
                <>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">Choose a plan</h2>
                    <p className="text-[13px] text-muted-foreground/70">
                      Pick a plan to unlock VoxGen.
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
                    <h2 className="text-xl font-semibold tracking-tight">Your free trial is active</h2>
                    <p className="text-[13px] text-muted-foreground/70">
                      You have {trialDaysLeft} days of full access — no credit card required. Start dictating right away.
                    </p>
                  </div>

                  {/* Trial badge */}
                  <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-semibold text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      Active
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining
                    </span>
                  </div>

                  {activated ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                        <CheckIcon />
                      </div>
                      <p className="text-[13px] font-medium text-primary">License activated!</p>
                    </div>
                  ) : (
                    <>
                      <Button onClick={() => setStep(2)} className="w-full rounded-xl h-10">
                        Continue
                      </Button>

                      {/* Collapsible "Already purchased?" section */}
                      <div className="border-t border-border/20 pt-3">
                        <button
                          onClick={() => setShowPurchaseSection(!showPurchaseSection)}
                          className="flex w-full items-center justify-between text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors"
                        >
                          <span>Already purchased?</span>
                          {showPurchaseSection ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {showPurchaseSection && (
                          <div className="mt-3 space-y-2">
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
                                variant="outline"
                              >
                                {checking ? 'Checking...' : 'Activate'}
                              </Button>
                            </div>
                            {error && error !== 'No license found for this email' && (
                              <p className="text-[11px] text-red-400">{error}</p>
                            )}
                            {error === 'No license found for this email' && (
                              <div className="rounded-lg border border-border/30 bg-muted/20 p-2.5 space-y-1.5">
                                <p className="text-[11px] text-muted-foreground">
                                  No purchase found for this email. Check the confirmation email from Stripe for the address you used at checkout.
                                </p>
                                <p className="text-[11px] text-muted-foreground/60">
                                  Your trial is still active — you can start using VoxGen right away.
                                </p>
                                <button
                                  onClick={() => setShowPlanPicker(true)}
                                  className="text-[11px] text-primary hover:underline font-medium"
                                >
                                  View plans
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Hotkey Setup */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Set up your hotkeys</h2>
                <p className="text-[13px] text-muted-foreground/70">
                  These shortcuts work from any app. You can change them later in Settings.
                </p>
              </div>

              <div className="space-y-2.5">
                <HotkeyCard
                  emoji="🎙"
                  title="Hold-to-Record"
                  desc="Hold key to speak, release to paste"
                  value={settings.holdHotkey}
                  onChange={(v) => updateSetting('holdHotkey', v)}
                />
                <HotkeyCard
                  emoji="⏯"
                  title="Toggle Recording"
                  desc="Press once to start, again to stop"
                  value={settings.toggleHotkey}
                  onChange={(v) => updateSetting('toggleHotkey', v)}
                />
                <HotkeyCard
                  emoji="✨"
                  title="AI Prompt"
                  desc="Speak a prompt for AI content generation"
                  value={settings.promptHotkey}
                  onChange={(v) => updateSetting('promptHotkey', v)}
                />
              </div>

              <div className="rounded-lg border border-primary/15 bg-primary/5 px-3.5 py-2.5">
                <p className="text-[11px] text-primary/80">
                  <span className="font-semibold">Try it now:</span> Press and hold{' '}
                  <kbd className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                    {displayHotkeyName(settings.holdHotkey || 'RightAlt')}
                  </kbd>{' '}
                  — you should see the recording overlay appear at the bottom of your screen.
                </p>
              </div>

              <Button onClick={() => setStep(3)} className="w-full rounded-xl h-10">
                Next
              </Button>
            </div>
          )}

          {/* Step 3: How to Use */}
          {step === 3 && (
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
                  desc={<>Hold <kbd className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[11px] font-semibold">{displayHotkeyName(settings.holdHotkey || 'RightAlt')}</kbd> from any app</>}
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

function HotkeyCard({
  emoji,
  title,
  desc,
  value,
  onChange,
}: {
  emoji: string
  title: string
  desc: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 px-3.5 py-2.5">
      <span className="text-base shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium leading-tight">{title}</p>
        <p className="text-[10px] text-muted-foreground/50 leading-tight">{desc}</p>
      </div>
      <HotkeyRecorder value={value} onChange={onChange} allowClear />
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
