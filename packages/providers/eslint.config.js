import baseConfig from '@mindworld/eslint-config/base'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['scripts/*'],
  },
  ...baseConfig,
]
