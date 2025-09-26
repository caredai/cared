// import { CommandMenu } from '@/components/command-menu'
import { TopRightNav } from '@/components/top-right-nav'
import { MainNav } from './-main-nav'
import { MobileNav } from './-mobile-nav'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-grid border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full">
        <div className="px-4 h-14 flex items-center">
          <MainNav />
          <MobileNav />
          <div className="flex flex-1 items-center justify-between gap-4 md:justify-end">
            {/*<div className="w-full flex-1 md:w-auto md:flex-none">*/}
            {/*  <CommandMenu />*/}
            {/*</div>*/}
            <TopRightNav />
          </div>
        </div>
      </div>
    </header>
  )
}
