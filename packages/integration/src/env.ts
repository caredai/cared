import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod/v4'

import { runtimeEnv } from '@cared/shared'

export const env = createEnv({
  server: {
    ENCRYPTION_KEY: z.string(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_TRUSTED_ORIGINS: z
      .string()
      .transform((s) =>
        s
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      )
      .optional(),

    GITHUB_APP_ID: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_PRIVATE_KEY: z.string().min(1),
    GITHUB_WEBHOOK_SECRET: z.string().min(1),
    NODE_ENV: z.enum(['development', 'production']).optional(),
  },

  clientPrefix: 'VITE_',

  client: {
    VITE_API_URL: z.string().optional(),
    VITE_WEB_URL: z.string().optional(),
  },

  runtimeEnv: runtimeEnv(),

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
