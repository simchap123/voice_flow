import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, Crown, Loader2, Zap } from 'lucide-react'

interface PlanPickerProps {
  email: string
  onBack: () => void
  onActivated: () => void
}

const PLANS = [
  {
    id: 'monthly' as const,
    name: 'Pro Monthly',
    price: '$9',
    period: '/mo',
    desc: 'Cancel anytime',
    badge: null,
    highlight: false,
  },
  {
    id: 'yearly' as const,
    name: 'Pro Yearly',
    price: '$59',
    period: '/yr',
    desc: '$4.92/mo · Billed annually',
    badge: 'Save 45%',
    highlight: true,
  },
  {
    id: 'lifetime' as const,
    name: 'Lifetime',
    price: '$149',
    period: '',
    desc: 'One-time payment · BYOK',
    badge: null,
    highlight: false,
  },
]

type PlanId = 'monthly' | 'yearly' | 'lifetime'

export function PlanPicker({ email, onBack, onActivated }: PlanPickerProps) {
  const [loading, setLoading] = useState<PlanId | null>(null)
  const [waitingForPayment, setWaitingForPayment] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  async function handlePickPlan(plan: PlanId) {
    setLoading(plan)
    setError('')

    try {
      const res = await fetch('https://voxgenflow.vercel.app/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        setError(data.error || 'Failed to create checkout session')
        setLoading(null)
        return
      }

      // Open Stripe checkout in browser
      window.electronAPI?.openExternal(data.url)
      setLoading(null)
      setWaitingForPayment(true)

      // Start polling for license
      startPolling()
    } catch {
      setError('Connection failed. Check your internet.')
      setLoading(null)
    }
  }

  function startPolling() {
    // Poll every 5 seconds
    pollRef.current = setInterval(async () => {
      try {
        const result = await window.electronAPI?.validateByEmail(email)
        if (result?.valid) {
          stopPolling()
          onActivated()
        }
      } catch {
        // Ignore poll errors, keep trying
      }
    }, 5000)

    // Timeout after 10 minutes
    timeoutRef.current = setTimeout(() => {
      stopPolling()
      setTimedOut(true)
    }, 10 * 60 * 1000)
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function handleRetry() {
    setTimedOut(false)
    setWaitingForPayment(false)
  }

  // Waiting for payment state
  if (waitingForPayment) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { stopPolling(); handleRetry() }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to plans
        </button>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-center space-y-3">
          {timedOut ? (
            <>
              <p className="text-sm font-medium">Still waiting?</p>
              <p className="text-xs text-muted-foreground">
                We haven't detected a payment yet. If you already paid, try clicking Activate again with your email.
              </p>
              <Button size="sm" onClick={handleRetry} className="mt-2">
                Try Again
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-6 w-6 text-primary mx-auto animate-spin" />
              <p className="text-sm font-medium">Complete your payment in the browser</p>
              <p className="text-xs text-muted-foreground">
                We'll automatically detect your license once payment is complete.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
        <p className="text-[11px] text-muted-foreground truncate ml-2">{email}</p>
      </div>

      <div className="space-y-2">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => handlePickPlan(plan.id)}
            disabled={loading !== null}
            className={`w-full rounded-lg border p-3 text-left transition-all ${
              plan.highlight
                ? 'border-primary/40 bg-primary/5 hover:border-primary/60'
                : 'border-border hover:border-border/80 hover:bg-muted/30'
            } ${loading !== null ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {plan.highlight ? (
                  <Crown className="h-3.5 w-3.5 text-primary" />
                ) : plan.id === 'lifetime' ? (
                  <Zap className="h-3.5 w-3.5 text-yellow-500" />
                ) : null}
                <span className="text-sm font-medium">{plan.name}</span>
                {plan.badge && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {plan.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {loading === plan.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-sm font-semibold">
                    {plan.price}
                    <span className="text-xs font-normal text-muted-foreground">{plan.period}</span>
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 ml-5.5">{plan.desc}</p>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-[11px] text-red-400">{error}</p>
      )}

      <p className="text-[10px] text-muted-foreground/60 text-center">
        Secure checkout powered by Stripe
      </p>
    </div>
  )
}
