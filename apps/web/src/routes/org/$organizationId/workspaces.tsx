'use client'

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Box, ChevronRight, Plus } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { Card, CardHeader, CardTitle } from '@cared/ui/components/card'

import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog'
import { SectionTitle } from '@/components/section'
import { useActiveOrganizationId } from '@/hooks/use-active'
import { useApps } from '@/hooks/use-app'
import { useWorkspaces } from '@/hooks/use-workspace'
import { stripIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/org/$organizationId/workspaces')({
  component: Workspaces,
})

function Workspaces() {
  const { activeOrganizationId } = useActiveOrganizationId()
  const navigate = useNavigate()
  const workspaces = useWorkspaces(activeOrganizationId)
  const apps = useApps({
    organizationId: activeOrganizationId,
  })

  // Calculate app count for each workspace
  const getWorkspaceAppCount = (workspaceId: string) => {
    return apps.filter((app) => app.app.workspaceId === workspaceId).length
  }

  const handleWorkspaceClick = (workspaceId: string) => {
    void navigate({ to: `/workspace/${stripIdPrefix(workspaceId)}/apps` })
  }

  return (
    <>
      <SectionTitle title="Workspaces" />

      <div className="flex justify-end">
        <CreateWorkspaceDialog
          organizationId={activeOrganizationId}
          trigger={
            <Button>
              <Plus />
              Create
            </Button>
          }
        />
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-12">
          <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first workspace to get started with building AI applications.
          </p>
          <CreateWorkspaceDialog
            organizationId={activeOrganizationId}
            trigger={
              <Button variant="outline">
                <Plus />
                Create Workspace
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => {
            const appCount = getWorkspaceAppCount(workspace.id)
            return (
              <Card
                key={workspace.id}
                className="cursor-pointer hover:shadow-md hover:bg-muted transition-shadow duration-200 group"
                onClick={() => handleWorkspaceClick(workspace.id)}
              >
                <CardHeader className="pb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Box className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate text-base">{workspace.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {appCount} {appCount === 1 ? 'app' : 'apps'}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
