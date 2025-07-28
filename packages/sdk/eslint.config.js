import baseConfig from '@cared/eslint-config/base'
import reactConfig from '@cared/eslint-config/react'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['types/*'],
  },
  ...baseConfig,
  ...reactConfig,
]
