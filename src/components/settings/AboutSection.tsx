import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, RefreshCw, CheckCircle } from 'lucide-react'

export function AboutSection() {
  const [appVersion, setAppVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready' | 'up-to-date' | 'error'>('idle')
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)

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
    // App will quit, install silently, and relaunch
    await window.electronAPI.installUpdate()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">About</h2>
        <p className="text-sm text-muted-foreground">Version information and updates</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">VoxGen</CardTitle>
            {appVersion && (
              <Badge variant="secondary" className="text-xs">v{appVersion}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI-powered dictation and content generation for Windows.
          </p>

          {updateStatus === 'ready' && updateVersion ? (
            // Update downloaded and ready — prominent install button
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
