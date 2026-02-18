export interface CustomPrompt {
  id: string
  title: string          // "Email Writer"
  icon: string           // Emoji: "📧"
  description: string    // "Formats text as a professional email"
  promptText: string     // The actual AI instruction text
  triggerWords: string[] // ["write email", "email mode"]
  useSystemInstructions: boolean  // Wrap with "don't answer" system prompt
  isPredefined: boolean  // true = shipped with app, can't delete
  isActive: boolean      // Currently selected
  createdAt: number
}
