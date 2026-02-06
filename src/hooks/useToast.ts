import { useState, useCallback } from 'react'

export interface ToastMessage {
  id: number
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
}

let toastId = 0

// Global toast state for use across components
let globalAddToast: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null

export function toast(msg: Omit<ToastMessage, 'id'>) {
  globalAddToast?.(msg)
}

export function useToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = ++toastId
    setToasts(prev => [...prev, { ...msg, id }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Register global handler
  globalAddToast = addToast

  return { toasts, addToast, removeToast }
}
