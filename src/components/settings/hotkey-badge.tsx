const isWindows = navigator.userAgent.includes('Windows')

const DISPLAY_NAMES: Record<string, string> = {
  'RightAlt': 'Right Alt',
  'LeftAlt': 'Left Alt',
  'RightControl': 'Right Ctrl',
  'LeftControl': 'Left Ctrl',
  'RightShift': 'Right Shift',
  'LeftShift': 'Left Shift',
  'Super': isWindows ? 'Windows' : 'Super',
}

function displayHotkey(hotkey: string): string {
  return DISPLAY_NAMES[hotkey] || hotkey
}

const PAGE_NAMES: Record<string, string> = {
  'dictation': 'Dictation',
  'ai-prompt': 'AI Prompt',
}

export interface HotkeyBadgeProps {
  label: string
  hotkey: string
  editPage: string
  onNavigate: (page: string) => void
}

export function HotkeyBadge({ label, hotkey, editPage, onNavigate }: HotkeyBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2">
      {hotkey ? (
        hotkey.split('+').map((part, i) => (
          <span key={part} className="inline-flex items-center">
            {i > 0 && <span className="text-muted-foreground/30 mx-0.5">+</span>}
            <kbd className="bg-muted text-muted-foreground text-xs font-mono rounded px-2 py-0.5">
              {displayHotkey(part)}
            </kbd>
          </span>
        ))
      ) : (
        <span className="text-[11px] text-muted-foreground/40">Not set</span>
      )}
      <button
        type="button"
        onClick={() => onNavigate(editPage)}
        aria-label={`Edit ${label} in ${PAGE_NAMES[editPage] || editPage} settings`}
        className="text-primary text-[11px] hover:underline transition-colors ml-1"
      >
        Edit →
      </button>
    </div>
  )
}
