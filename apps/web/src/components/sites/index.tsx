import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Globe2, MoreVertical, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { DataTable } from '@cared/ui/components/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cared/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@cared/ui/components/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@cared/ui/components/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import type { CaredSite, SiteDeployment } from '@/hooks/use-sites'
import type { ColumnDef } from '@tanstack/react-table'
import { formatRegionCount, StatusBadge } from '@/components/deployment-status'
import { SectionTitle } from '@/components/section'
import {
  useCaredSites,
  useCreateCaredSite,
  useSiteDeployments,
  useSiteFrameworks,
  useSiteRegions,
} from '@/hooks/use-sites'

export function SitesPage() {
  const { data, isLoading } = useCaredSites()
  const [selected, setSelected] = useState<CaredSite | null>(null)
  const sites = data?.sites ?? []

  const columns = useMemo<ColumnDef<CaredSite, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Site',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <Globe2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'framework',
        header: 'Framework',
        cell: ({ row }) => <span className="text-sm">{row.original.framework}</span>,
      },
      {
        id: 'mode',
        header: 'Deployment',
        cell: ({ row }) => (
          <Badge variant={row.original.deploymentMode === 'global' ? 'default' : 'secondary'}>
            {row.original.deploymentMode === 'global' ? 'Global' : 'Single region'}
          </Badge>
        ),
      },
      {
        id: 'primaryRegion',
        header: 'Primary region',
        cell: ({ row }) => <span className="text-sm">{row.original.primaryRegion.name}</span>,
      },
      {
        id: 'regions',
        header: 'Regions',
        cell: ({ row }) => (
          <Badge variant="secondary">{formatRegionCount(row.original.regions.length)}</Badge>
        ),
      },
      {
        id: 'deployment',
        header: 'Latest deployment',
        cell: ({ row }) => (
          <StatusBadge status={row.original.primarySite?.latestDeploymentStatus} />
        ),
      },
      {
        id: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(row.original.updatedAt, { addSuffix: true })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setSelected(row.original)}>
                  View details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <SectionTitle
        title="Sites"
        description="Deploy web applications to one region or globally."
      />

      <div className="flex justify-end">
        <CreateSiteDialog />
      </div>

      <DataTable
        columns={columns}
        data={sites}
        searchKeys={['name', 'id', 'framework']}
        searchPlaceholder="Search sites..."
        getRowId={(row) => row.id}
        onRowClick={setSelected}
      />

      {!isLoading && !sites.length && (
        <p className="text-sm text-muted-foreground">No sites yet.</p>
      )}

      <SiteDetailsSheet site={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  )
}

function CreateSiteDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [deploymentMode, setDeploymentMode] = useState<'single_region' | 'global'>('single_region')
  const [regionId, setRegionId] = useState('')
  const [framework, setFramework] = useState('')
  const { data: regionsData } = useSiteRegions()
  const regions = regionsData?.regions ?? []
  const primaryRegionId = deploymentMode === 'single_region' ? regionId : regions[0]?.id
  const { data: frameworksData } = useSiteFrameworks(primaryRegionId)
  const frameworks = frameworksData?.frameworks ?? []
  const selectedFramework = frameworks.find((item) => item.key === framework)
  const createMutation = useCreateCaredSite()

  async function submit() {
    if (!name.trim() || !framework || !primaryRegionId || !selectedFramework) return

    const adapter =
      selectedFramework.adapters.find((item) => item.key === 'ssr') ??
      selectedFramework.adapters.find((item) => item.key === 'static') ??
      selectedFramework.adapters[0]

    if (!adapter) return

    try {
      if (deploymentMode === 'single_region') {
        await createMutation.mutateAsync({
          deploymentMode,
          regionId: primaryRegionId,
          name: name.trim(),
          framework: framework as never,
          buildRuntime: selectedFramework.buildRuntime as never,
          adapter: adapter.key as never,
          installCommand: adapter.installCommand,
          buildCommand: adapter.buildCommand,
          outputDirectory: adapter.outputDirectory,
          fallbackFile: adapter.fallbackFile,
          enabled: true,
          logging: true,
        })
      } else {
        await createMutation.mutateAsync({
          deploymentMode,
          name: name.trim(),
          framework: framework as never,
          buildRuntime: selectedFramework.buildRuntime as never,
          adapter: adapter.key as never,
          installCommand: adapter.installCommand,
          buildCommand: adapter.buildCommand,
          outputDirectory: adapter.outputDirectory,
          fallbackFile: adapter.fallbackFile,
          enabled: true,
          logging: true,
        })
      }

      toast.success('Site created')
      setOpen(false)
      setName('')
      setDeploymentMode('single_region')
      setRegionId('')
      setFramework('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create site')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create site
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create site</DialogTitle>
          <DialogDescription>
            Deploy to one region, or globally across all regions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Deployment</Label>
            <RadioGroup
              value={deploymentMode}
              onValueChange={(value) => {
                setDeploymentMode(value as 'single_region' | 'global')
                setFramework('')
              }}
              className="grid gap-2 sm:grid-cols-2"
            >
              <label className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value="single_region" />
                <span className="text-sm">Single region</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value="global" />
                <span className="text-sm">Global</span>
              </label>
            </RadioGroup>
          </div>

          {deploymentMode === 'single_region' && (
            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                value={regionId}
                onValueChange={(value) => {
                  setRegionId(value)
                  setFramework('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {deploymentMode === 'global' && (
            <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              Global sites are deployed to every region. Newly added regions will be joined later.
            </p>
          )}

          <div className="space-y-2">
            <Label>Framework</Label>
            <Select value={framework} onValueChange={setFramework} disabled={!primaryRegionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={submit}
            disabled={
              !name.trim() ||
              !framework ||
              !primaryRegionId ||
              createMutation.isPending ||
              (deploymentMode === 'single_region' && !regionId)
            }
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SiteDetailsSheet({
  site,
  onOpenChange,
}: {
  site: CaredSite | null
  onOpenChange: (open: boolean) => void
}) {
  const deploymentsQuery = useSiteDeployments(site)

  return (
    <Sheet open={!!site} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        {site && (
          <>
            <SheetHeader>
              <SheetTitle>{site.name}</SheetTitle>
            </SheetHeader>
            <Tabs defaultValue="overview" className="mt-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="regions">Regions</TabsTrigger>
                <TabsTrigger value="deployments">Deployments</TabsTrigger>
                <TabsTrigger value="domains">Domains</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 pt-4">
                <InfoRow label="Framework" value={site.framework} />
                <InfoRow
                  label="Deployment"
                  value={site.deploymentMode === 'global' ? 'Global' : 'Single region'}
                />
                <InfoRow label="Primary region" value={site.primaryRegion.name} />
                <InfoRow
                  label="Latest deployment"
                  value={site.primarySite?.latestDeploymentStatus ?? 'unknown'}
                />
              </TabsContent>
              <TabsContent value="regions" className="space-y-3 pt-4">
                {site.regions.map((region) => (
                  <div
                    key={region.regionId}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{region.regionId}</p>
                      {site.primaryRegionId === region.regionId && (
                        <p className="text-xs text-muted-foreground">Primary region</p>
                      )}
                      {region.syncError && (
                        <p className="mt-1 text-xs text-muted-foreground">{region.syncError}</p>
                      )}
                    </div>
                    <StatusBadge status={region.syncStatus} />
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="deployments" className="pt-4 text-sm text-muted-foreground">
                <DeploymentList
                  deployments={deploymentsQuery.data?.deployments ?? []}
                  isLoading={deploymentsQuery.isLoading}
                  activeDeploymentId={site.activeDeploymentId}
                />
              </TabsContent>
              <TabsContent value="domains" className="pt-4 text-sm text-muted-foreground">
                Custom domains for global sites are managed globally through Cared networking.
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DeploymentList({
  deployments,
  isLoading,
  activeDeploymentId,
}: {
  deployments: SiteDeployment[]
  isLoading: boolean
  activeDeploymentId: string | null
}) {
  if (isLoading) {
    return <p>Loading deployments...</p>
  }

  if (!deployments.length) {
    return <p>No deployments yet.</p>
  }

  return (
    <div className="space-y-3">
      {deployments.map((deployment) => (
        <div key={deployment.id} className="rounded-md border p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-foreground">{deployment.id}</p>
                {activeDeploymentId === deployment.id && <Badge variant="outline">Active</Badge>}
              </div>
              <p className="mt-1 text-xs">
                {formatDistanceToNow(deployment.createdAt, { addSuffix: true })}
                {deployment.providerBranch ? ` from ${deployment.providerBranch}` : ''}
              </p>
            </div>
            <StatusBadge status={deployment.status} />
          </div>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <DeploymentMeta label="Commit" value={deployment.providerCommitHash || '-'} />
            <DeploymentMeta label="Size" value={formatBytes(deployment.totalSize)} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DeploymentMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span>{label}: </span>
      <span className="break-all text-foreground">{value}</span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function formatBytes(value: number) {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const size = value / 1024 ** index
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}
