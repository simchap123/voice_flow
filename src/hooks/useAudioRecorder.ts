import { useState, useRef, useCallback } from 'react'

interface UseAudioRecorderReturn {
  isRecording: boolean
  startRecording: (deviceId?: string) => Promise<void>
  stopRecording: () => Promise<Blob | null>
  cancelRecording: () => void
  duration: number
  analyserNode: AnalyserNode | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setAnalyserNode(null)
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId && deviceId !== 'default'
          ? { deviceId: { exact: deviceId } }
          : true,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Set up Web Audio API for waveform
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      setAnalyserNode(analyser)

      // Set up MediaRecorder (WebM/Opus)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setDuration(0)
      startTimeRef.current = Date.now()

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 200)
    } catch (error) {
      console.error('Failed to start recording:', error)
      cleanup()
      throw error
    }
  }, [cleanup])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        cleanup()
        resolve(null)
        return
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []
        cleanup()
        resolve(blob)
      }

      mediaRecorder.stop()
    })
  }, [cleanup])

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    chunksRef.current = []
    cleanup()
    setDuration(0)
  }, [cleanup])

  return {
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
    duration,
    analyserNode,
  }
}
