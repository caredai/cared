import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod/v4'

import { runtimeEnv } from '@cared/shared'

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
    UPSTASH_WORKFLOW_URL: z.string().min(1).optional(), // TODO: remove
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    TURBOPUFFER_API_KEY: z.string().min(1).optional(),
    WHITELIST_CARED_APPS: z
      .string()
      .transform((s) =>
        s
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      )
      .optional(),

    LAGO_API_KEY: z.string().min(1).optional(),
    LAGO_API_URL: z.string().min(1).optional(),
    LAGO_BILLING_ENTITY_CODE: z.string().min(1).optional(),
    LAGO_STRIPE_CONNECTION_CODE: z.string().min(1).optional(),

    LANGFUSE_BASEURL: z.string().min(1).optional(),
    LANGFUSE_ADMIN_API_KEY: z.string().min(1).optional(),

    REDGW_API_URL: z.string().min(1).optional(),
    REDGW_API_KEY: z.string().min(1).optional(),

    RAGFLOW_ADMIN_USERNAME: z.string().min(1).default('admin@ragflow.io'),
    RAGFLOW_ADMIN_PASSWORD: z.string().min(1).default('admin'),
    RAGFLOW_ADMIN_API_URL: z.string().min(1).optional(),
    RAGFLOW_API_URL: z.string().min(1).optional(),
    RAGFLOW_API_TOKEN: z.string().min(1).optional(),

    LANGFLOW_API_URL: z.string().min(1).optional(),
    LANGFLOW_ADMIN_API_KEY: z.string().min(1).optional(),
    LANGFLOW_USER_API_KEY: z.string().min(1).optional(),

    NEON_PERSONAL_API_KEY: z.string().min(1).optional(),
    NEON_FREE_ORG_ID: z.string().min(1).optional(),
    NEON_PAID_ORG_ID: z.string().min(1).optional(),
    NEON_FREE_ORG_API_KEY: z.string().min(1).optional(),
    NEON_PAID_ORG_API_KEY: z.string().min(1).optional(),

    // <region>:<url>,<region>:<url>,...
    SUPABASE_STORAGE_API_URLS: z
      .string()
      .transform((s) =>
        s
          .split(',')
          .map((s) =>
            s
              .trim()
              .split(':')
              .map((s) => s.trim())
              .filter(Boolean),
          )
          .filter((pair) => pair.length === 2),
      )
      .optional(),
    SUPABASE_STORAGE_ADMIN_API_KEY: z.string().min(1).optional(),

    DAYTONA_API_URL: z.string().min(1).optional(),
    DAYTONA_ADMIN_API_KEY: z.string().min(1).optional(),
    DAYTONA_ORGANIZATION_API_KEY: z.string().min(1).optional(),

    APPWRITE_API_DOMAIN: z.string().min(1).optional(),
    APPWRITE_COMPUTE_DOMAIN: z.string().min(1).optional(),
    APPWRITE_EDGE_DOMAIN: z.string().min(1).optional(),
    // <id>:<name>,<id>:<name>,...
    APPWRITE_REGIONS: z
      .string()
      .transform((s) =>
        s
          .split(',')
          .map((s) =>
            s
              .trim()
              .split(':')
              .map((s) => s.trim())
              .filter(Boolean),
          )
          .filter((pair) => pair.length === 2),
      )
      .optional(),
    APPWRITE_USER_PASSWORD: z.string().min(1).optional(),
    APPWRITE_PROJECT_KEY: z.string().length(256).optional(),

    TEMPORAL_ADDRESS: z.string().min(1).default('localhost:7233'),
    TEMPORAL_NAMESPACE: z.string().min(1).default('default'),
    TEMPORAL_TASK_QUEUE: z.string().min(1).default('cared-api'),

    CACHE_MAX_SIZE: z
      .int()
      .positive()
      .default(50 * 1024 * 1024), // default 50MB

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

  runtimeEnv: runtimeEnv(),

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
