import { useState, useEffect, useCallback } from 'react'
import { Download, Check, AlertCircle, Loader2, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getSTTProvider, getLocalWhisperProvider } from '@/lib/stt/provider-factory'
import type { ProgressEvent } from '@/lib/stt/local-whisper'

type ModelSize = 'tiny' | 'base' | 'small' | 'medium'

interface LocalModelManagerProps {
  modelSize: ModelSize
  onModelSizeChange: (size: ModelSize) => void
}

const MODEL_OPTIONS: { value: ModelSize; label: string; size: string; description: string }[] = [
  { value: 'tiny', label: 'Tiny', size: '~75 MB', description: 'Fastest, lower accuracy' },
  { value: 'base', label: 'Base', size: '~150 MB', description: 'Good balance (recommended)' },
  { value: 'small', label: 'Small', size: '~500 MB', description: 'Higher accuracy, slower' },
  { value: 'medium', label: 'Medium', size: '~1.5 GB', description: 'Best accuracy, slowest' },
]

export function LocalModelManager({ modelSize, onModelSizeChange }: LocalModelManagerProps) {
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressFile, setProgressFile] = useState('')
  const [modelReady, setModelReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ensure provider is created and check initial status
  useEffect(() => {
    getSTTProvider('local')
    const provider = getLocalWhisperProvider()
    if (provider) {
      provider.setModelSize(modelSize)
      setModelReady(provider.isModelLoaded())
      setDownloading(provider.isModelLoading())
    }
  }, [modelSize])

  const handleModelSizeChange = useCallback((size: ModelSize) => {
    const provider = getLocalWhisperProvider()
    if (provider) {
      provider.setModelSize(size)
      setModelReady(provider.isModelLoaded())
    }
    onModelSizeChange(size)
    setError(null)
  }, [onModelSizeChange])

  const handleDownload = useCallback(async () => {
    const provider = getLocalWhisperProvider()
    if (!provider) return

    setDownloading(true)
    setError(null)
    setProgress(0)
    setProgressFile('')

    const unsubscribe = provider.onProgress((event: ProgressEvent) => {
      if (event.status === 'progress' && event.progress !== undefined) {
        setProgress(Math.round(event.progress))
        if (event.file) {
          const shortName = event.file.split('/').pop() ?? event.file
          setProgressFile(shortName)
        }
      }
    })

    try {
      await provider.loadModel()
      setModelReady(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed'
      setError(message)
      setModelReady(false)
    } finally {
      unsubscribe()
      setDownloading(false)
    }
  }, [])

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <Label className="flex items-center gap-2">
        <HardDrive className="h-4 w-4" />
        Local Model
      </Label>
      <p className="text-xs text-muted-foreground">
        Runs entirely on your device. No internet needed after download.
      </p>

      {/* Model size selector */}
      <div className="grid gap-1.5">
        {MODEL_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
              modelSize === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            } ${downloading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              type="radio"
              name="localModelSize"
              value={opt.value}
              checked={modelSize === opt.value}
              onChange={() => handleModelSizeChange(opt.value)}
              disabled={downloading}
              className="accent-primary"
            />
            <div className="flex-1">
              <span className="font-medium">{opt.label}</span>
              <span className="ml-2 text-muted-foreground">{opt.size}</span>
            </div>
            <span className="text-xs text-muted-foreground">{opt.description}</span>
          </label>
        ))}
      </div>

      {/* Download / Status */}
      {downloading ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Downloading model...</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {progress}%{progressFile ? ` — ${progressFile}` : ''}
          </p>
        </div>
      ) : modelReady ? (
        <div className="flex items-center gap-1.5 text-sm text-green-500">
          <Check className="h-4 w-4" />
          Model ready
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
          <Download className="h-4 w-4" />
          Download model now
        </Button>
      )}

      {!modelReady && !downloading && (
        <p className="text-xs text-muted-foreground">
          Or skip — the model downloads automatically on first dictation.
        </p>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
