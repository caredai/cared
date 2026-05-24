import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { Provider as JotaiProvider } from 'jotai'

import { mergeWithoutUndefined } from '@cared/shared'

import type { ImageConfigComplete } from '@/lib/image/image-config'
import { ThemeProvider } from '@/components/theme'
import { imageConfig } from '@/lib/config'
import { imageConfigDefault } from '@/lib/image/image-config'
import { ImageConfigContext } from '@/lib/image/image-config-context.shared-runtime'

const ClientPrivyProvider = lazy(() =>
  import('@/components/privy-provider').then((module) => ({
    default: module.ClientPrivyProvider,
  })),
)

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <JotaiProvider>
        <ImageConfigContext.Provider
          // @ts-ignore
          value={mergeWithoutUndefined<ImageConfigComplete>(imageConfigDefault, imageConfig)}
        >
          <ClientOnly fallback={children}>
            <Suspense fallback={children}>
              <ClientPrivyProvider>{children}</ClientPrivyProvider>
            </Suspense>
          </ClientOnly>
        </ImageConfigContext.Provider>
      </JotaiProvider>
    </ThemeProvider>
  )
}
