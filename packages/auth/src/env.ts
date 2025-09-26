import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod/v4'

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
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
    CLOUDFLARE_WORKERS_KV_URL: z.string().min(1).optional(),
    CLOUDFLARE_WORKERS_KV_API_TOKEN: z.string().min(1).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    TWITTER_CLIENT_ID: z.string().min(1),
    TWITTER_CLIENT_SECRET: z.string().min(1),
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    ADMIN_USER_EMAIL: z.string().email().optional(),
    NODE_ENV: z.enum(['development', 'production']).optional(),
  },

  clientPrefix: 'VITE_',

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `VITE_`.
   */
  client: {
    VITE_API_URL: z.string().optional(),
    VITE_WEB_URL: z.string().optional(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
