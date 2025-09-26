import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod/v4'

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    ENCRYPTION_KEY: z
      .string()
      .length(
        64,
        'ENCRYPTION_KEY must be 256 bits, 64 string characters in hex format, generate via: openssl rand -hex 32',
      ),
    S3_BUCKET: z.string().min(1),
    S3_ENDPOINT: z.string().min(1),
    S3_REGION: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    QSTASH_TOKEN: z.string().min(1),
    QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional(),
    QSTASH_URL: z.string().min(1).optional(),
    UPSTASH_WORKFLOW_URL: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    WHITELIST_CARED_APPS: z
      .string()
      .transform((s) =>
        s
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      )
      .optional(),
    NODE_ENV: z.enum(['development', 'production']).optional(),
  },

  clientPrefix: 'VITE_',

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `VITE_`.
   */
  client: {
    VITE_IMAGE_URL: z.string().url().optional(),
    VITE_STRIPE_CREDITS_PRICE_ID: z.string().min(1).optional(),
    VITE_STRIPE_CREDITS_AUTO_TOPUP_PRICE_ID: z.string().min(1).optional(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
