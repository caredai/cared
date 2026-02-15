import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import mdx from 'fumadocs-mdx/vite'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

import * as MdxConfig from './source.config'

const FumadocsDeps = ['fumadocs-core', 'fumadocs-mdx', 'fumadocs-ui']

export default defineConfig(async ({ command }) => {
  return {
    envDir: '../../',
    server: {
      port: 3002,
    },
    plugins: [
      ...(command === 'build'
        ? [
            cloudflare({
              viteEnvironment: { name: 'ssr' },
            }),
          ]
        : []),
      mdx(MdxConfig),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart({
        prerender: {
          enabled: false, // TODO: @cloudflare/vite-plugin bug
        },
      }),
      viteReact(),
    ],
    build: {
      assetsDir: 'docs/assets',
    },
    resolve: {
      noExternal: FumadocsDeps,
    },
    optimizeDeps: {
      exclude: FumadocsDeps,
    },
  }
})
