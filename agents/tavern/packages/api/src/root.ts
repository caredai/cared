import { createTRPCRouter } from './trpc'
import { characterRouter } from './trpc/character'
import { lorebookRouter } from './trpc/lorebook'
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
  lorebook: lorebookRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
