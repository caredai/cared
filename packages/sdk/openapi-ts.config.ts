import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input:
    'https://raw.githubusercontent.com/caredai/daytona/refs/heads/v0.140.0-cared/apps/daemon/pkg/toolbox/docs/swagger.json',
  output: 'src/sandbox/toolbox',
  plugins: [
    'zod',
    {
      name: '@hey-api/sdk',
      validator: true,
    },
    // '@tanstack/react-query',
  ],
})
