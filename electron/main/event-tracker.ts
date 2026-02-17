import { app, net } from 'electron'
import { getSetting, getDeviceId } from './store'

const API_BASE = 'https://voxgenflow.vercel.app'

type EventType = 'app_launch' | 'app_error' | 'feature_used'

function sendEvent(eventType: EventType, payload: Record<string, unknown> = {}): void {
  const deviceId = getDeviceId()
  const email = getSetting('userEmail') || undefined

  const body = JSON.stringify({
    deviceId,
    email,
    eventType,
    payload,
    appVersion: app.getVersion(),
    platform: `${process.platform}-${process.arch}`,
  })

  try {
    const request = net.request({
      url: `${API_BASE}/api/track-event`,
      method: 'POST',
    })

    request.setHeader('Content-Type', 'application/json')

    request.on('response', (response) => {
      // Drain response
      response.on('data', () => {})
      response.on('end', () => {})
    })

    request.on('error', (err) => {
      console.error(`[VoxGen] Event tracking failed (${eventType}):`, err.message)
    })

    request.write(body)
    request.end()
  } catch (err: any) {
    console.error(`[VoxGen] Event tracking error (${eventType}):`, err.message)
  }
}

export function trackAppLaunch(isFirstLaunch: boolean): void {
  sendEvent('app_launch', {
    is_first_launch: isFirstLaunch,
    electron_version: process.versions.electron,
    node_version: process.versions.node,
  })
}

export function trackError(error: string, context?: string): void {
  sendEvent('app_error', {
    error: error.slice(0, 500),
    context: context ?? 'unknown',
  })
}

export function trackFeatureUsed(feature: string, details?: Record<string, unknown>): void {
  sendEvent('feature_used', {
    feature,
    ...details,
  })
}

export function setupErrorReporting(): void {
  process.on('uncaughtException', (err) => {
    console.error('[VoxGen] Uncaught exception:', err.message)
    trackError(err.message, 'uncaughtException')
  })

  process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason)
    console.error('[VoxGen] Unhandled rejection:', message)
    trackError(message, 'unhandledRejection')
  })
}
