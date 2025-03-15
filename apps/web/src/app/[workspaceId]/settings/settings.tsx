'use client'

import { useState } from 'react'
import { Settings as SettingsIcon, Users } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@mindworld/ui/components/tabs'

import { useWorkspace } from '@/hooks/use-workspace'
import { General } from './_settings/general'
import { Members } from './_settings/members'

/**
 * Workspace settings component with tabs for different settings categories
 */
export function Settings() {
  const workspace = useWorkspace()

  const [activeTab, setActiveTab] = useState<string>('general')

  if (!workspace) {
    return null
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{workspace.name} Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your workspace settings and team members
        </p>
      </div>

      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <General workspace={workspace} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Members workspace={workspace} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
