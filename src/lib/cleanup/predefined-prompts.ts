import type { CustomPrompt } from '@/types/custom-prompt'
import {
  DEFAULT_CLEANUP_INSTRUCTIONS,
  CHAT_CLEANUP_INSTRUCTIONS,
  EMAIL_CLEANUP_INSTRUCTIONS,
  REWRITE_CLEANUP_INSTRUCTIONS,
} from './system-prompts'

/**
 * The 4 built-in prompts shipped with VoxGen.
 * These can be edited but not deleted.
 */
export const PREDEFINED_PROMPTS: CustomPrompt[] = [
  {
    id: 'default',
    title: 'Default Cleanup',
    icon: '✨',
    description: 'Clean up transcription for clarity and natural flow',
    promptText: DEFAULT_CLEANUP_INSTRUCTIONS,
    triggerWords: [],
    useSystemInstructions: true,
    isPredefined: true,
    isActive: true,
    createdAt: 0,
  },
  {
    id: 'chat',
    title: 'Chat Message',
    icon: '💬',
    description: 'Rewrite as a casual, concise chat message',
    promptText: CHAT_CLEANUP_INSTRUCTIONS,
    triggerWords: ['chat mode', 'message mode'],
    useSystemInstructions: true,
    isPredefined: true,
    isActive: false,
    createdAt: 0,
  },
  {
    id: 'email',
    title: 'Email',
    icon: '📧',
    description: 'Rewrite as a complete, professional email with greeting and closing',
    promptText: EMAIL_CLEANUP_INSTRUCTIONS,
    triggerWords: ['email mode', 'write email'],
    useSystemInstructions: true,
    isPredefined: true,
    isActive: false,
    createdAt: 0,
  },
  {
    id: 'rewrite',
    title: 'Rewrite',
    icon: '🔄',
    description: 'Enhanced clarity, improved structure, natural flow',
    promptText: REWRITE_CLEANUP_INSTRUCTIONS,
    triggerWords: ['rewrite mode', 'polish mode'],
    useSystemInstructions: true,
    isPredefined: true,
    isActive: false,
    createdAt: 0,
  },
]

/**
 * Get a prompt by ID — checks predefined first, then user prompts.
 */
export function getPromptById(
  id: string,
  userPrompts: CustomPrompt[] = []
): CustomPrompt | undefined {
  return (
    PREDEFINED_PROMPTS.find(p => p.id === id) ||
    userPrompts.find(p => p.id === id)
  )
}
