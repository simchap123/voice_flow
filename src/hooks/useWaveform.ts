import { useRef, useEffect, useCallback } from 'react'

export function useWaveform(analyserNode: AnalyserNode | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserNode
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const render = () => {
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      const centerY = canvas.height / 2
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * centerY * 0.9

        // Purple gradient based on amplitude
        const hue = 262
        const lightness = 40 + (dataArray[i] / 255) * 30
        ctx.fillStyle = `hsl(${hue}, 83%, ${lightness}%)`

        // Draw mirrored bars from center
        ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight)
        ctx.fillRect(x, centerY, barWidth - 1, barHeight)

        x += barWidth
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()
  }, [analyserNode])

  useEffect(() => {
    if (analyserNode) {
      draw()
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [analyserNode, draw])

  return canvasRef
}
