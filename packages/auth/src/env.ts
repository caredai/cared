import { vercel } from '@t3-oss/env-core/presets-zod'
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  extends: [vercel()],
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    NODE_ENV: z.enum(['development', 'production']).optional(),
  },
  client: {
    NEXT_PUBLIC_MIND_URL: z.string().url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_MIND_URL: process.env.NEXT_PUBLIC_MIND_URL,
  },
  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
