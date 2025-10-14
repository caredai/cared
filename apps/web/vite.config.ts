import { ServerOptions as HttpsServerOptions } from 'node:https'
import type { RollupLog } from 'rollup'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import commonjs from 'vite-plugin-commonjs'
import mkcert from 'vite-plugin-mkcert'
import svgr from 'vite-plugin-svgr'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, '../../', '')

  return {
    envDir: '../../',
    server: {
      port: 3000,
      https: !!env.VITE_HTTPS as unknown as HttpsServerOptions,
    },
    plugins: [
      ...(command === 'build'
        ? [
            cloudflare({
              viteEnvironment: { name: 'ssr' },
            }),
          ]
        : []),
      mkcert(),
      commonjs(),
      tsConfigPaths(),
      tailwindcss(),
      tanstackStart(),
      svgr(),
      viteReact(),
    ],
    build: {
      commonjsOptions: { transformMixedEsModules: true },
      rollupOptions: {
        onwarn(warning: RollupLog, defaultHandler: (warning: string | RollupLog) => void) {
          if (warning.code !== 'INVALID_ANNOTATION') defaultHandler(warning)
        },
      },
    },
    ssr: {
      noExternal: ['react-use'],
    },
    optimizeDeps: {
      include: ['react-use'],
    },
  }
})
