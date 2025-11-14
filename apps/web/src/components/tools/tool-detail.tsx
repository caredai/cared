import { Suspense } from 'react'
import { ArrowLeftIcon } from 'lucide-react'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cared/ui/components/card'

import { SkeletonCard } from '@/components/skeleton'
import { JSONView } from '@/components/tracing/JsonView'
import { useTool } from '@/hooks/use-tools'

/**
 * Tool detail content component
 * Displays detailed information about a tool
 */
function ToolDetailContent({ toolSlug }: { toolSlug: string }) {
  const tool = useTool(toolSlug)

  return (
    <div className="flex-1 overflow-y-auto space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-semibold">{tool.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Slug</span>
              <span className="text-sm font-mono">{tool.slug}</span>
            </div>
            {tool.description && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Description</span>
                <span className="text-sm text-right max-w-[70%]">{tool.description}</span>
              </div>
            )}
            {tool.toolkit && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Toolkit</span>
                <span className="text-sm">{tool.toolkit.name}</span>
              </div>
            )}
            {tool.version && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-mono">{tool.version}</span>
              </div>
            )}
            {tool.isDeprecated && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="destructive">Deprecated</Badge>
              </div>
            )}
            {tool.isNoAuth && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Authentication</span>
                <Badge variant="secondary">No Auth Required</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        {tool.tags && tool.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tool.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scopes */}
        {tool.scopes && tool.scopes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Scopes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tool.scopes.map((scope) => (
                  <Badge key={scope} variant="secondary">
                    {scope}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Input Parameters */}
        {tool.inputParameters && (
          <Card>
            <CardHeader>
              <CardTitle>Input Parameters</CardTitle>
              <CardDescription>Parameters required to execute this tool</CardDescription>
            </CardHeader>
            <CardContent>
              <JSONView json={tool.inputParameters} title="Input Parameters" />
            </CardContent>
          </Card>
        )}

        {/* Output Parameters */}
        {tool.outputParameters && (
          <Card>
            <CardHeader>
              <CardTitle>Output Parameters</CardTitle>
              <CardDescription>Expected output structure from this tool</CardDescription>
            </CardHeader>
            <CardContent>
              <JSONView json={tool.outputParameters} title="Output Parameters" />
            </CardContent>
          </Card>
        )}

        {/* Available Versions */}
        {tool.availableVersions && tool.availableVersions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tool.availableVersions.map((version) => (
                  <Badge key={version} variant={version === tool.version ? 'default' : 'outline'}>
                    {version}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  )
}

/**
 * Tool detail component
 * Displays detailed information about a tool with Suspense
 */
export function ToolDetail({ toolSlug, onBack }: { toolSlug: string; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Tool Details</h2>
      </div>

      <Suspense fallback={<SkeletonCard />}>
        <ToolDetailContent toolSlug={toolSlug} />
      </Suspense>
    </div>
  )
}

