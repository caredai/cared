import { vercel } from '@t3-oss/env-core/presets-zod'
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {},

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_IMAGE_URL: z.string().url().optional(),
    NEXT_PUBLIC_PRIVY_APP_ID: z.string(),
    NEXT_PUBLIC_REOWN_PROJECT_ID: z.string(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_IMAGE_URL: process.env.NEXT_PUBLIC_IMAGE_URL,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_REOWN_PROJECT_ID: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
  },
  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
