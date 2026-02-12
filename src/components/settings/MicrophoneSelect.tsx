import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Mic } from 'lucide-react'

interface MicrophoneSelectProps {
  value: string
  onChange: (deviceId: string) => void
}

interface AudioDevice {
  deviceId: string
  label: string
}

export function MicrophoneSelect({ value, onChange }: MicrophoneSelectProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadDevices()
    // Re-enumerate when devices change (plug/unplug)
    navigator.mediaDevices?.addEventListener('devicechange', loadDevices)
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', loadDevices)
    }
  }, [])

  async function loadDevices() {
    try {
      // Request permission first (needed to get device labels)
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
        s.getTracks().forEach(t => t.stop())
      })
      const all = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = all
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
        }))
      setDevices(audioInputs)
      setError('')
    } catch {
      setError('Could not access microphone list')
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Mic className="h-4 w-4" />
        Microphone
      </Label>
      <p className="text-xs text-muted-foreground">
        Select which microphone to use for recording
      </p>
      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="default">System Default</option>
          {devices.map(d => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
