import baseConfig from '@cared/eslint-config/base'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['drizzle-gateway/**'],
  },
  ...baseConfig,
]
