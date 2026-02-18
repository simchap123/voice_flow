import type { PowerMode } from '@/types/power-mode'

export function matchPowerMode(
  windowInfo: { processName: string; title: string } | null,
  powerModes: PowerMode[]
): PowerMode | null {
  if (!windowInfo) return null
  for (const mode of powerModes) {
    if (!mode.isEnabled) continue
    // URL (title) matchers first — most specific
    for (const pattern of mode.urlMatchers) {
      if (pattern.trim() && windowInfo.title.toLowerCase().includes(pattern.toLowerCase())) return mode
    }
    // App process matchers
    for (const app of mode.appMatchers) {
      if (app.processName.trim() && windowInfo.processName.toLowerCase().includes(app.processName.toLowerCase())) return mode
    }
  }
  return null
}
