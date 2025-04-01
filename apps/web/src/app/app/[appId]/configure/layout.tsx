import Link from 'next/link'
import { KeyIcon, UsersIcon } from 'lucide-react'

import { TabsContent, TabsList, TabsTrigger } from '@ownxai/ui/components/tabs'

import NavTabs from './nav-tabs'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight truncate">App Configuration</h1>
        <p className="text-muted-foreground mt-2">Manage your app configuration</p>
      </div>

      <NavTabs>
        <TabsList className="w-full max-w-md">
          <TabsLinkTrigger href="./api-key">
            <KeyIcon className="h-4 w-4" />
            API key
          </TabsLinkTrigger>
          <TabsLinkTrigger href="./oauth-application">
            <UsersIcon className="h-4 w-4" />
            OAuth application
          </TabsLinkTrigger>
        </TabsList>

        <TabsContent value="./api-key" className="space-y-4">
          {children}
        </TabsContent>
        <TabsContent value="./oauth-application" className="space-y-4">
          {children}
        </TabsContent>
      </NavTabs>
    </div>
  )
}

function TabsLinkTrigger({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <TabsTrigger value={href} asChild>
      <Link href={href}>{children}</Link>
    </TabsTrigger>
  )
}
