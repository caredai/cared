'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@ownxai/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ownxai/ui/components/dropdown-menu'

import { META_THEME_COLORS } from '@/config/site'
import { useMetaColor } from '@/hooks/use-meta-color'

export { ThemeProvider } from 'next-themes'

export function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme()
  const { setMetaColor } = useMetaColor()

  useEffect(() => {
    setMetaColor(resolvedTheme === 'light' ? META_THEME_COLORS.light : META_THEME_COLORS.dark)
  }, [resolvedTheme, setMetaColor])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="group/toggle h-8 w-8 px-0">
          <SunIcon className="hidden [html.light_&]:block" />
          <MoonIcon className="hidden [html.dark_&]:block" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
