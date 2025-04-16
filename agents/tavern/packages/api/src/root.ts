import { modelPresetRouter } from './router/model-preset'
import { settingsRouter } from './router/settings'
import { themeRouter } from './router/theme'
import { userRouter } from './router/user'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  user: userRouter,
  settings: settingsRouter,
  modelPreset: modelPresetRouter,
  theme: themeRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
