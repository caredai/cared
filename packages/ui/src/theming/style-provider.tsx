'use client'

import type { ReactNode } from 'react'
import * as Portal from '@radix-ui/react-portal'
import { useTheme } from 'next-themes'

import type { Theme, ThemeConfig } from './theme-config'
import { ThemeStyleSheet } from './theme-style-sheet'
import { themeToStyles } from './theme-to-styles'

export const StyleProvider = ({
  themeConfig,
  children,
}: {
  themeConfig: ThemeConfig
  children: ReactNode
}) => {
  const { resolvedTheme } = useTheme()
  const activeTheme: Theme = themeConfig[resolvedTheme === 'light' ? 'light' : 'dark']

  const style = themeToStyles(activeTheme)

  return (
    <div style={style}>
      {children}
      <Portal.Root asChild>
        <ThemeStyleSheet themeConfig={themeConfig} />
      </Portal.Root>
    </div>
  )
}
