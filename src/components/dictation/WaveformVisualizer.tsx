import type { RefObject } from 'react'

interface WaveformVisualizerProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  className?: string
}

export function WaveformVisualizer({ canvasRef, className }: WaveformVisualizerProps) {
  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className={className ?? 'w-full rounded-lg opacity-90'}
    />
  )
}
