import baseConfig, { restrictEnvAccess } from '@cared/eslint-config/base'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['scripts/*', 'dist/**'],
  },
  ...baseConfig,
  ...restrictEnvAccess,
]
