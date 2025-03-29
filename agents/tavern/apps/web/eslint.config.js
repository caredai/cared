import baseConfig, { restrictEnvAccess } from '@ownxai/eslint-config/base'
import nextjsConfig from '@ownxai/eslint-config/nextjs'
import reactConfig from '@ownxai/eslint-config/react'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['.next/**'],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
]
