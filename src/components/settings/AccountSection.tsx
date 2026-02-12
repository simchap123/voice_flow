import { useEffect, useState } from 'react'
import { LicenseInput } from '@/components/settings/LicenseInput'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Type, Clock } from 'lucide-react'

function UsageBanner() {
  const [totalWords, setTotalWords] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)

  useEffect(() => {
    window.electronAPI?.getHistory().then((entries: any[]) => {
      let words = 0
      let seconds = 0
      for (const entry of entries) {
        words += entry.wordCount ?? 0
        seconds += entry.duration ?? 0
      }
      setTotalWords(words)
      setTotalMinutes(Math.round(seconds / 60))
    })
  }, [])

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Type className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{totalWords.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">Words dictated</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{totalMinutes.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">Minutes recorded</p>
        </div>
      </div>
    </div>
  )
}

export function AccountSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">License activation and trial status</p>
      </div>

      <UsageBanner />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">License</CardTitle>
          <CardDescription>Activate your license with the email used at purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <LicenseInput />
        </CardContent>
      </Card>
    </div>
  )
}
