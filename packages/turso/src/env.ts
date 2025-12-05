import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod/v4'

import { runtimeEnv } from '@cared/shared'

const groupTokens = z.record(z.string(), z.string())

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    TURSO_ORGANIZATION: z.string().min(1),
    TURSO_GROUP_TOKENS: z.string().transform((s) => groupTokens.parse(JSON.parse(s))),
    NODE_ENV: z.enum(['development', 'production']).optional(),
  },

  clientPrefix: 'VITE_',

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `VITE_`.
   */
  client: {},

  runtimeEnv: runtimeEnv(),

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
