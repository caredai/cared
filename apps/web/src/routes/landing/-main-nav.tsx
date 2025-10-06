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
          // @ts-expect-error `/docs` should be another site
          to="/docs"
          preload={false}
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname === '/docs' ? 'text-foreground' : 'text-foreground/80',
          )}
        >
          Docs
        </Link>
        <Link
          to="/wallet"
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname.startsWith('/docs/components') && !pathname.startsWith('/docs/component/chart')
              ? 'text-foreground'
              : 'text-foreground/80',
          )}
        >
          Wallet
        </Link>
      </nav>
    </div>
  )
}
