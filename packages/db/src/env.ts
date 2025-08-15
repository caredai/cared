import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod/v4'

export const env = createEnv({
  server: {
    POSTGRES_URL: z.string().min(1),
    POSTGRES_DONT_USE_VERCEL_CLIENT: z.stringbool().optional(),
    NODE_ENV: z.enum(['development', 'production']).optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
