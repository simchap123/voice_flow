import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AboutSection() {
  const [appVersion, setAppVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(setAppVersion)
  }, [])

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI) return
    setCheckingUpdate(true)
    setUpdateStatus(null)
    try {
      const result = await window.electronAPI.checkForUpdates()
      if (result.updateAvailable) {
        if (result.downloaded) {
          setUpdateStatus(`Update v${result.version} ready — restart to install`)
        } else {
          setUpdateStatus(`Update v${result.version} available — downloading...`)
        }
      } else {
        setUpdateStatus('Up to date')
      }
    } catch {
      setUpdateStatus('Failed to check for updates')
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleInstallUpdate = async () => {
    if (!window.electronAPI) return
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

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckForUpdates}
              disabled={checkingUpdate}
            >
              {checkingUpdate ? 'Checking...' : 'Check for Updates'}
            </Button>
            {updateStatus?.includes('restart') && (
              <Button size="sm" onClick={handleInstallUpdate}>
                Restart & Update
              </Button>
            )}
          </div>
          {updateStatus && (
            <p className="text-xs text-muted-foreground">{updateStatus}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
