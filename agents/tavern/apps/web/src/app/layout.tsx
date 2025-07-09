import type { Metadata, Viewport } from 'next'
import { config } from '@fortawesome/fontawesome-svg-core'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import { Toaster } from '@/components/sonner'

import '@fortawesome/fontawesome-svg-core/styles.css'

import { cn } from '@ownxai/ui/lib/utils'

import '@/globals.css'

import { Providers } from '@/components/providers'
import { env } from '@/env'

config.autoAddCss = false

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === 'production' ? 'https://cryptotavern.dev' : 'http://localhost:3000',
  ),
  title: 'CryptoTavern | Immersive Conversational AI Platform',
  description: 'AI roleplay, lorebook, memory, prompt engineering',
  openGraph: {
    title: 'CryptoTavern | Immersive Conversational AI Platform',
    description: 'AI roleplay, lorebook, memory, prompt engineering',
    url: 'https://cryptotavern.dev',
    siteName: 'CryptoTavern',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Crypto_Tavern',
    creator: '@deckard2079',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans text-foreground antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
