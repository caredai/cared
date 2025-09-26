import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { KeyIcon, UsersIcon } from 'lucide-react'

import { SectionTitle } from '@/components/section'
import { TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import NavTabs from './-nav-tabs'

export const Route = createFileRoute('/app/$appId/configure')({
  component: () => {
    return (
      <>
        <SectionTitle title="App Configuration" />

        <NavTabs>
          <TabsList>
            <TabsLinkTrigger href="./api-keys">
              <KeyIcon className="h-4 w-4" />
              API key
            </TabsLinkTrigger>
            <TabsLinkTrigger href="./oauth-application">
              <UsersIcon className="h-4 w-4" />
              OAuth application
            </TabsLinkTrigger>
          </TabsList>

          <TabsContent value="./api-keys" className="space-y-4">
            <Outlet />
          </TabsContent>
          <TabsContent value="./oauth-application" className="space-y-4">
            <Outlet />
          </TabsContent>
        </NavTabs>
      </>
    )
  },
})

function TabsLinkTrigger({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <TabsTrigger value={href} asChild>
      <Link to={href}>{children}</Link>
    </TabsTrigger>
  )
}
