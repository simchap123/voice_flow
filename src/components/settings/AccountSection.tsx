import { useEffect, useState } from 'react'
import { LicenseInput } from '@/components/settings/LicenseInput'
import { EmailReminder } from '@/components/settings/EmailReminder'
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
      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Type className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none tracking-tight">{totalWords.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">Words dictated</p>
        </div>
      </div>
      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none tracking-tight">{totalMinutes.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">Minutes recorded</p>
        </div>
      </div>
    </div>
  )
}

export function AccountSection() {
  const [appVersion, setAppVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready' | 'up-to-date' | 'error'>('idle')
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(setAppVersion)

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
    window.electronAPI?.openExternal('https://voxgenflow.vercel.app/whats-new.html')
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Account</h2>
        <p className="text-[12px] text-muted-foreground/60">License activation, usage stats, and app info</p>
      </div>

      <EmailReminder />

      <UsageBanner />

      {/* License */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border/30 px-5 py-4">
          <h3 className="text-[13px] font-semibold">License</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">Activate with the email used at purchase</p>
        </div>
        <div className="p-5">
          <LicenseInput />
        </div>
      </div>

      {/* App Info & Updates */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border/30 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h3 className="text-[13px] font-semibold">VoxGen</h3>
              {appVersion && (
                <Badge variant="secondary" className="rounded-lg text-[10px] font-medium px-2 py-0.5">
                  v{appVersion}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWhatsNew}
              className="gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" />
              What's New
            </Button>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-[13px] text-muted-foreground/60">
            AI-powered dictation and content generation for Windows.
          </p>

          {updateStatus === 'ready' && updateVersion ? (
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleInstallUpdate} className="gap-1.5 rounded-xl">
                <Download className="h-3.5 w-3.5" />
                Install v{updateVersion} & Restart
              </Button>
              <p className="text-[11px] text-muted-foreground/60">
                Installs silently and relaunches in seconds
              </p>
            </div>
          ) : updateStatus === 'downloading' && updateVersion ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground/60" />
              <p className="text-[12px] text-muted-foreground/60">Downloading v{updateVersion}...</p>
            </div>
          ) : updateStatus === 'up-to-date' ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
              <p className="text-[12px] text-muted-foreground/60">You're on the latest version</p>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckForUpdates}
              disabled={updateStatus === 'checking'}
              className="gap-1.5 rounded-xl"
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
            <p className="text-[11px] text-red-400">Failed to check for updates</p>
          )}
        </div>
      </div>
    </div>
  )
}
