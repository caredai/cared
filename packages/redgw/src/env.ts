import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod/v4'

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    API_KEY: z.string().min(1),
    REDIS_CLUSTER_HEADLESS_SERVICE_HOSTNAME: z.string().min(1),
    REDIS_PASSWORD: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    S3_ENDPOINT: z.string().min(1),
    S3_REGION: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    PORT: z.int().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(['development', 'production']).optional(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
