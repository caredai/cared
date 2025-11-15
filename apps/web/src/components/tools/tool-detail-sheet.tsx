import { Suspense, useState } from 'react'
import { ServerIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Badge } from '@cared/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import { Separator } from '@cared/ui/components/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@cared/ui/components/sheet'
import { Tabs, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import { CopyButton } from '@/components/copy-button'
import { SkeletonCard } from '@/components/skeleton'
import { PrettyJsonView } from '@/components/tracing/PrettyJsonView'
import { useTool } from '@/hooks/use-tools'

/**
 * Tool detail content component
 * Displays detailed information about a tool
 */
function ToolDetailContent({ toolSlug }: { toolSlug: string }) {
  const tool = useTool(toolSlug)
  const [inputView, setInputView] = useState<'pretty' | 'json'>('pretty')
  const [outputView, setOutputView] = useState<'pretty' | 'json'>('pretty')

  return (
    <div className="flex flex-col space-y-4">
      {/* Basic Information */}
      <Card>
        <CardContent className="space-y-4">
          {/* Slug */}
          <div className="flex items-center gap-2 h-8">
            <span className="text-sm text-muted-foreground font-bold">Slug</span>
            <Separator orientation="vertical" className="max-h-4" />
            <span className="text-sm font-bold font-mono">{tool.slug}</span>
            <CopyButton value={tool.slug} />
          </div>

          {/* Version */}
          {tool.version && (
            <div className="flex items-center gap-2 h-8">
              <span className="text-sm text-muted-foreground font-bold">Version</span>
              <Separator orientation="vertical" className="max-h-4" />
              <span className="text-sm font-bold font-mono">{tool.version}</span>
              <CopyButton value={tool.version} />
            </div>
          )}

          {/* Description */}
          {tool.description && <p className="text-sm text-muted-foreground">{tool.description}</p>}

          {/* Other information */}
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

      {/* Input Parameters */}
      {tool.inputParameters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Input</CardTitle>
                <CardDescription>Parameters required to execute this tool</CardDescription>
              </div>
              <Tabs
                className="h-fit"
                value={inputView}
                onValueChange={(value) => setInputView(value as 'pretty' | 'json')}
              >
                <TabsList className="h-fit py-0.5">
                  <TabsTrigger value="pretty" className="h-fit px-1 text-xs">
                    Formatted
                  </TabsTrigger>
                  <TabsTrigger value="json" className="h-fit px-1 text-xs">
                    JSON
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <PrettyJsonView json={tool.inputParameters} currentView={inputView} />
          </CardContent>
        </Card>
      )}

      {/* Output Parameters */}
      {tool.outputParameters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Output</CardTitle>
                <CardDescription>Expected output structure from this tool</CardDescription>
              </div>
              <Tabs
                className="h-fit"
                value={outputView}
                onValueChange={(value) => setOutputView(value as 'pretty' | 'json')}
              >
                <TabsList className="h-fit py-0.5">
                  <TabsTrigger value="pretty" className="h-fit px-1 text-xs">
                    Formatted
                  </TabsTrigger>
                  <TabsTrigger value="json" className="h-fit px-1 text-xs">
                    JSON
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <PrettyJsonView json={tool.outputParameters} currentView={outputView} />
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
    </div>
  )
}

/**
 * Tool detail sheet component
 * Displays detailed information about a tool in a sheet
 */
export function ToolDetailSheet({
  tool,
  toolkitLogoUrl,
  open,
  onOpenChange,
}: {
  tool: { slug: string; name: string }
  toolkitLogoUrl?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[800px] gap-2">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {toolkitLogoUrl && (
              <Avatar className="size-6 rounded-lg">
                <AvatarImage src={toolkitLogoUrl} alt="" />
                <AvatarFallback>
                  <ServerIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <SheetTitle>{tool.name}</SheetTitle>
          </div>
        </SheetHeader>
        <Separator/>
        <div className="h-full overflow-y-auto p-4">
          <Suspense fallback={<SkeletonCard />}>
            <ToolDetailContent toolSlug={tool.slug} />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  )
}
