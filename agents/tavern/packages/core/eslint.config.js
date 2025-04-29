import baseConfig, { restrictEnvAccess } from '@ownxai/eslint-config/base'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [],
  },
  ...baseConfig,
  ...restrictEnvAccess,
]
