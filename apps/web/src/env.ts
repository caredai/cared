import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod/v4'

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },

  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {},

  clientPrefix: 'VITE_',

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `VITE_`.
   */
  client: {
    VITE_IMAGE_URL: z.string().url().optional(),
    VITE_PRIVY_APP_ID: z.string(),
    VITE_REOWN_PROJECT_ID: z.string(),
    VITE_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    VITE_STRIPE_PRICING_TABLE_ID: z.string().min(1).optional(),
    VITE_STRIPE_CREDITS_PRICE_ID: z.string().min(1).optional(),
    VITE_HELIO_CREDITS_PAYLINK_ID: z.string().min(1).optional(),
  },

  runtimeEnv: Object.assign({}, process.env, import.meta.env),

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
