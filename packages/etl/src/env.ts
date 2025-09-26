import { createEnv } from "@t3-oss/env-core";
import { z } from 'zod/v4'

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    UNSTRUCTURED_API_URL: z.string().min(1).optional(),
    UNSTRUCTURED_API_KEY: z.string().min(1),
    NODE_ENV: z.enum(['development', 'production']).optional(),
  },

  clientPrefix: "VITE_",

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `VITE_`.
   */
  client: {},

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
