import baseConfig, { restrictEnvAccess } from '@ownxai/eslint-config/base'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['scripts/*', 'dist/**'],
  },
  ...baseConfig,
  ...restrictEnvAccess,
]
