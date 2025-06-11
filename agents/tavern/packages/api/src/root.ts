import { createTRPCRouter } from './trpc'
import { characterRouter } from './trpc/character'
import { characterGroupRouter } from './trpc/character-group'
import { chatRouter } from './trpc/chat'
import { lorebookRouter } from './trpc/lorebook'
import { messageRouter } from './trpc/message'
import { modelRouter } from './trpc/model'
import { modelPresetRouter } from './trpc/model-preset'
import { settingsRouter } from './trpc/settings'
import { themeRouter } from './trpc/theme'
import { userRouter } from './trpc/user'

export const appRouter = createTRPCRouter({
  user: userRouter,
  settings: settingsRouter,
  modelPreset: modelPresetRouter,
  theme: themeRouter,
  character: characterRouter,
  characterGroup: characterGroupRouter,
  lorebook: lorebookRouter,
  chat: chatRouter,
  message: messageRouter,
  model: modelRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
