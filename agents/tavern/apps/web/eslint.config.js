import baseConfig, { restrictEnvAccess } from '@cared/eslint-config/base'
import nextjsConfig from '@cared/eslint-config/nextjs'
import reactConfig from '@cared/eslint-config/react'

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
