import baseConfig from '@ownxai/eslint-config/base'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['scripts/*', 'data/*'],
  },
  ...baseConfig,
]
