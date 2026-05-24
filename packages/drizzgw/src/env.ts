import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod/v4'

export const env = createEnv({
  server: {
    CARED_API_URL: z.url(),
    DOMAIN_SUFFIX: z.string().min(1),
    DRIZZLE_GATEWAY_IMAGE: z.string().min(1),
    REDIS_CLUSTER_HEADLESS_SERVICE_HOSTNAME: z.string().min(1),
    REDIS_PASSWORD: z.string().min(1),
    K8S_NAMESPACE: z.string().min(1).default('cared'),
    /** Comma-separated web origins allowed to call POST /_cared/sync (credentials). */
    CORS_ALLOWED_ORIGINS: z
      .string()
      .min(1)
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    /** Minutes of inactivity before a gateway pod is removed. */
    MAX_IDLE_MINUTES: z.coerce.number().positive().default(5),
    /**
     * Seconds before offload where cached gateway URLs are not trusted
     * (forces a Kubernetes read or recreate).
     */
    NEAR_IDLE_BUFFER_SECONDS: z.coerce.number().nonnegative().default(20),
    NODE_ENV: z.enum(['development', 'production']).optional(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
