import Link from 'next/link'
import { UsersIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ownxai/ui/components/tabs'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight truncate">App Configuration</h1>
        <p className="text-muted-foreground mt-2">Manage your app configuration</p>
      </div>

      <Tabs defaultValue="./oauth-application" className="space-y-4">
        <TabsList className="w-full max-w-md">
          <TabsLinkTrigger href="./oauth-application">
            <UsersIcon className="h-4 w-4" />
            OAuth application
          </TabsLinkTrigger>
        </TabsList>

        <TabsContent value="./oauth-application" className="space-y-4">
          {children}
        </TabsContent>
      </Tabs>
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
