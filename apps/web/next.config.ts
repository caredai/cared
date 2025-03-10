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
    '@mindworld/chatbot',
    '@mindworld/i18n',
    '@mindworld/utils',
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

  // @ts-ignore
  webpack: (config, { webpack }) => {
    config.experiments = { ...config.experiments, topLevelAwait: true }
    config.externals['node:path'] = 'commonjs node:path'
    config.externals['node:fs'] = 'commonjs node:fs'
    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: false,
      fs: false,
    }
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        // @ts-ignore
        (resource) => {
          resource.request = resource.request.replace(/^node:/, '')
        },
      ),
    )

    return config
  },
}

export default config
