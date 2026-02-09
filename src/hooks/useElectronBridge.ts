import { useEffect, useCallback, useRef } from 'react'

export function useElectronBridge(callbacks?: {
  onStart?: (data?: { mode?: string }) => void
  onStop?: () => void
  onCancel?: () => void
}) {
  const isElectron = !!window.electronAPI
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!isElectron || !callbacksRef.current) return

    const cleanups: (() => void)[] = []

    if (callbacksRef.current.onStart) {
      cleanups.push(window.electronAPI!.onStartRecording((data) => callbacksRef.current?.onStart?.(data)))
    }
    if (callbacksRef.current.onStop) {
      cleanups.push(window.electronAPI!.onStopRecording(() => callbacksRef.current?.onStop?.()))
    }
    if (callbacksRef.current.onCancel) {
      cleanups.push(window.electronAPI!.onCancelRecording(() => callbacksRef.current?.onCancel?.()))
    }

    return () => cleanups.forEach(fn => fn())
  }, [isElectron])

  const injectText = useCallback(async (text: string) => {
    if (isElectron) {
      return window.electronAPI!.injectText(text)
    }
    // Fallback for web: copy to clipboard
    await navigator.clipboard.writeText(text)
    return { success: true, method: 'clipboard' }
  }, [isElectron])

  return { isElectron, injectText }
}
