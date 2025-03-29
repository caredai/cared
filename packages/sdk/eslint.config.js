import baseConfig from '@ownxai/eslint-config/base'
import reactConfig from '@ownxai/eslint-config/react'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['types/*'],
  },
  ...baseConfig,
  ...reactConfig,
]
