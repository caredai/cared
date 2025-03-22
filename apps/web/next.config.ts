// Import env files to validate at build time.
import '@/env'

const preview = process.env.DEPLOYMENT_PREVIEW === 'true'

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    '@mindworld/api',
    '@mindworld/auth',
    '@mindworld/chatbot',
    '@mindworld/db',
    '@mindworld/i18n',
    '@mindworld/providers',
    '@mindworld/shared',
    '@mindworld/ui',
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  experimental: {
    // https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#preventing-sensitive-data-from-being-exposed-to-the-client
    taint: true,
  },

  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default config
