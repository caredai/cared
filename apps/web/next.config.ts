// Import env files to validate at build time.
import '@/env'

import path from 'path'

const preview = process.env.DEPLOYMENT_PREVIEW === 'true'

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    '@cared/api',
    '@cared/auth',
    '@cared/db',
    '@cared/i18n',
    '@cared/kv',
    '@cared/providers',
    '@cared/tokenizer',
    '@cared/ui',
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  experimental: {
    useCache: true,
    dynamicIO: true,
    // https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#preventing-sensitive-data-from-being-exposed-to-the-client
    taint: true,
  },

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  outputFileTracingIncludes: {
    '/api/trpc/\\[trpc\\]': ['../../packages/tokenizer/assets/tokenizers/*'],
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),

  serverExternalPackages: ['@agnai/web-tokenizers'],
}

export default config
