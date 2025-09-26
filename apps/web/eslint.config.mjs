import pluginRouter from '@tanstack/eslint-plugin-router'

import baseConfig, { restrictEnvAccess } from '@cared/eslint-config/base'
import reactConfig from '@cared/eslint-config/react'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    rules: {
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            {
              from: 'package',
              package: '@tanstack/router-core',
              name: 'Redirect',
            },
          ],
        },
      ],
    },
  },
  ...baseConfig,
  ...reactConfig,
  ...restrictEnvAccess,
  ...pluginRouter.configs['flat/recommended'],
]
