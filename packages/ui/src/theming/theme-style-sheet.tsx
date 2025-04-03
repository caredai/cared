'use client'

import { useMemo } from 'react'

import type { ThemeConfig } from './theme-config'
import { themeToStyles } from './theme-to-styles'

// This weird approach is necessary to also style the portaled components
export const ThemeStyleSheet = ({ themeConfig }: { themeConfig: ThemeConfig }) => {
  const style = useMemo(() => {
    const styles = {
      light: themeToStyles(themeConfig.light),
      dark: themeToStyles(themeConfig.dark),
    }

    const lightStyles = Object.entries(styles.light)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n')

    const darkStyles = Object.entries(styles.dark)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n')

    return `
    html {
      ${lightStyles}
    }

    html.dark {
      ${darkStyles}
    }`
  }, [themeConfig])

  return <style dangerouslySetInnerHTML={{ __html: style }} />
}
