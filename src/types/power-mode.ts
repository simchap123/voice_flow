export interface AppMatcher {
  processName: string   // "chrome", "outlook"
  displayName: string   // "Google Chrome"
}

export interface PowerMode {
  id: string
  name: string
  emoji: string
  appMatchers: AppMatcher[]
  urlMatchers: string[]         // string-contains match against window title
  selectedPromptId: string
  sttProvider?: 'openai' | 'groq' | 'local' | 'deepgram'
  cleanupProvider?: 'openai' | 'groq' | 'none'
  isEnabled: boolean
}
