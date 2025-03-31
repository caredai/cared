'use client'

import type { ReactNode } from 'react'

import { TRPCReactProvider } from '@/trpc/client'
import { ThemeProvider } from './theme'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <InnerProviders>{children}</InnerProviders>
    </ThemeProvider>
  )
}

function InnerProviders({ children }: { children: ReactNode }) {
  return <TRPCReactProvider>{children}</TRPCReactProvider>
}
