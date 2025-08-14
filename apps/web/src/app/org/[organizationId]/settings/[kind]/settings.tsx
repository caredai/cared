'use client'

import { useRouter } from 'next/navigation'
import { SettingsIcon, UsersIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import { useActiveOrganization } from '@/hooks/use-active'
import { General } from './_settings/general'
import { Members } from './_settings/members'

export function Settings({ kind }: { kind: string }) {
  const router = useRouter()
  const { activeOrganization } = useActiveOrganization()

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight truncate">
          {activeOrganization.name} Settings
        </h1>
        <p className="text-muted-foreground mt-2">Manage your organization settings and members</p>
      </div>

      <Tabs
        value={kind}
        onValueChange={(value) => {
          router.push(`./${value}`)
        }}
        className="space-y-4"
      >
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="members">
            <UsersIcon className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <General organization={activeOrganization} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Members organization={activeOrganization} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
