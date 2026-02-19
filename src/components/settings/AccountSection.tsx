import { useEffect, useState } from 'react'
import { LicenseInput } from '@/components/settings/LicenseInput'
import { EmailReminder } from '@/components/settings/EmailReminder'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Type, Clock, Download, RefreshCw, CheckCircle, Sparkles } from 'lucide-react'

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
  const [appVersion, setAppVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready' | 'up-to-date' | 'error'>('idle')
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(setAppVersion)

    // Listen for background update events from main process
    const cleanup = window.electronAPI?.onUpdateStatus?.((data) => {
      if (data.status === 'downloading') {
        setUpdateStatus('downloading')
        setUpdateVersion(data.version ?? null)
      } else if (data.status === 'ready') {
        setUpdateStatus('ready')
        setUpdateVersion(data.version ?? null)
      }
    })
    return () => cleanup?.()
  }, [])

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI) return
    setUpdateStatus('checking')
    try {
      const result = await window.electronAPI.checkForUpdates()
      if (result.updateAvailable) {
        setUpdateVersion(result.version ?? null)
        setUpdateStatus(result.downloaded ? 'ready' : 'downloading')
      } else {
        setUpdateStatus('up-to-date')
      }
    } catch {
      setUpdateStatus('error')
    }
  }

  const handleInstallUpdate = async () => {
    if (!window.electronAPI) return
    await window.electronAPI.installUpdate()
  }

  const handleWhatsNew = () => {
    // Open What's New on website
    window.electronAPI?.openExternal('https://voxgenflow.vercel.app/whats-new.html')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">License activation, usage stats, and app info</p>
      </div>

      <EmailReminder />

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

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">VoxGen</CardTitle>
              {appVersion && (
                <Badge variant="secondary" className="text-xs">v{appVersion}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWhatsNew}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              What's New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI-powered dictation and content generation for Windows.
          </p>

          {updateStatus === 'ready' && updateVersion ? (
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleInstallUpdate} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Install v{updateVersion} & Restart
              </Button>
              <p className="text-xs text-muted-foreground">
                Installs silently and relaunches in seconds
              </p>
            </div>
          ) : updateStatus === 'downloading' && updateVersion ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Downloading v{updateVersion}...
              </p>
            </div>
          ) : updateStatus === 'up-to-date' ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <p className="text-xs text-muted-foreground">You're on the latest version</p>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckForUpdates}
              disabled={updateStatus === 'checking'}
              className="gap-1.5"
            >
              {updateStatus === 'checking' ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check for Updates'
              )}
            </Button>
          )}

          {updateStatus === 'error' && (
            <p className="text-xs text-red-400">Failed to check for updates</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
