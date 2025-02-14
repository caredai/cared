import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    CLERK_ADMIN_ORGANIZATION_ID: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    S3_ENDPOINT: z.string().min(1),
    S3_REGION: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    UPSTASH_QSTASH_TOKEN: z.string().min(1),
    NODE_ENV: z.enum(['development', 'production']).optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
