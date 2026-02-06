import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface TranscriptionPreviewProps {
  rawText: string
  cleanedText: string
  showRaw?: boolean
}

export function TranscriptionPreview({ rawText, cleanedText, showRaw = false }: TranscriptionPreviewProps) {
  const [copied, setCopied] = useState(false)
  const displayText = showRaw ? rawText : cleanedText

  if (!displayText) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-fade-in rounded-lg border border-border/50 bg-card/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {showRaw ? 'Raw transcription' : 'Cleaned text'}
        </span>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1.5 px-2 text-xs">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{displayText}</p>

      {showRaw && rawText !== cleanedText && (
        <div className="mt-3 border-t border-border/30 pt-3">
          <span className="text-xs font-medium text-muted-foreground">Cleaned</span>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{cleanedText}</p>
        </div>
      )}
    </div>
  )
}
