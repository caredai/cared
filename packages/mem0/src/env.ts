import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod/v4'

export const env = createEnv({
  server: {
    NEO4J_URL: z.string().min(1).optional(),
    NEO4J_USERNAME: z.string().min(1).optional(),
    NEO4J_PASSWORD: z.string().min(1).optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
