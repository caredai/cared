import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import mdx from 'fumadocs-mdx/vite'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

const FumadocsDeps = ['fumadocs-core', 'fumadocs-mdx', 'fumadocs-ui']

const config = defineConfig({
  envDir: '../../',
  server: {
    port: 3002,
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    mdx(await import('./source.config')),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      // https://github.com/TanStack/router/issues/5213#issuecomment-3344231116
      // prerender: {
      //   enabled: true,
      // },
    }),
    viteReact(),
  ],
  build: {
    assetsDir: 'docs/assets'
  },
  resolve: {
    noExternal: FumadocsDeps,
  },
  optimizeDeps: {
    exclude: FumadocsDeps,
  },
})

export default config
