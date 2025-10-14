'use client'

import { Link, useRouterState } from '@tanstack/react-router'

import { cn } from '@cared/ui/lib/utils'

import { Logo } from '@/components/logo'

export function MainNav() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  return (
    <div className="mr-4 hidden md:flex">
      <Link to="/" className="mr-8 flex items-center gap-2">
        <Logo showWordMark />
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium">
        <Link
          to="/models"
          preload={false}
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname === '/models' ? 'text-foreground/80' : 'text-foreground',
          )}
        >
          Models
        </Link>
        <Link
          // @ts-expect-error `/chat` should be another site
          to="/chat"
          preload={false}
          className={cn('transition-colors hover:text-foreground/80', 'text-foreground')}
        >
          Chat
        </Link>
        <Link
          // @ts-expect-error `/docs` should be another site
          to="/docs"
          className={cn('transition-colors hover:text-foreground/80', 'text-foreground')}
        >
          Docs
        </Link>
      </nav>
    </div>
  )
}
