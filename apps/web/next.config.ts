// Import env files to validate at build time.
import '@/env'

const preview = process.env.DEPLOYMENT_PREVIEW === 'true'

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    'next-image-export-optimizer',
    '@mindworld/api',
    '@mindworld/ui',
    '@mindworld/i18n',
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    loader: 'custom',
    imageSizes: !preview ? [16, 32, 48, 64, 96, 128, 256, 384] : [16],
    deviceSizes: !preview ? [640, 750, 828, 1080, 1200, 1920, 2048, 3840] : [640],
  },
  env: {
    nextImageExportOptimizer_imageFolderPath: 'public/images',
    nextImageExportOptimizer_exportFolderPath: 'out',
    nextImageExportOptimizer_quality: '75',
    nextImageExportOptimizer_storePicturesInWEBP: 'true',
    nextImageExportOptimizer_exportFolderName: 'nextImageExportOptimizer',
    nextImageExportOptimizer_generateAndUseBlurImages: 'true',
    nextImageExportOptimizer_remoteImageCacheTTL: '0',
  },

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
