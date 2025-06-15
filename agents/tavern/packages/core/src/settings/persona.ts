import { z } from 'zod'

export interface PersonaSettings {
  // ID of the active persona
  active?: string
  // ID of the default persona to use for new chats
  default?: string
  // Show notification when switching persona
  showNotification: boolean
  // Allow multiple persona connections per character
  allowMultiConnectionsPerCharacter: boolean
  // Auto-lock a chosen persona to the chat
  autoLockToChat: boolean
}

export const personaSettingsSchema = z.object({
  active: z.string().optional(),
  default: z.string().optional(),
  showNotification: z.boolean(),
  allowMultiConnectionsPerCharacter: z.boolean(),
  autoLockToChat: z.boolean(),
})

export function fillInPersonaSettingsWithDefaults(settings?: PersonaSettings): PersonaSettings {
  return (
    settings ?? {
      showNotification: true,
      allowMultiConnectionsPerCharacter: false,
      autoLockToChat: false,
    }
  )
}
