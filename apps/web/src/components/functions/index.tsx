import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Code2, Eye, MoreVertical, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Checkbox } from '@cared/ui/components/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@cared/ui/components/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import type { CaredFunction, FunctionDeployment } from '@/hooks/use-functions'
import type { ColumnDef } from '@tanstack/react-table'
import { formatRegionCount, StatusBadge } from '@/components/deployment-status'
import { SectionTitle } from '@/components/section'
import {
  useCaredFunctions,
  useCreateCaredFunction,
  useFunctionDeployments,
  useFunctionRegions,
  useFunctionRuntimes,
} from '@/hooks/use-functions'

export function FunctionsPage() {
  const { data, isLoading } = useCaredFunctions()
  const [selected, setSelected] = useState<CaredFunction | null>(null)
  const functions = data?.functions ?? []

  const columns = useMemo<ColumnDef<CaredFunction, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Function',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <Code2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'runtime',
        header: 'Runtime',
        cell: ({ row }) => <span className="text-sm">{row.original.runtime}</span>,
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
          <StatusBadge status={row.original.primaryFunction?.latestDeploymentStatus} />
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
                  <Eye className="mr-2 h-4 w-4" />
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
      <SectionTitle title="Functions" description="Run server-side code across selected regions." />

      <div className="flex justify-end">
        <CreateFunctionDialog />
      </div>

      <DataTable
        columns={columns}
        data={functions}
        searchKeys={['name', 'id', 'runtime']}
        searchPlaceholder="Search functions..."
        getRowId={(row) => row.id}
        onRowClick={setSelected}
      />

      {!isLoading && !functions.length && (
        <p className="text-sm text-muted-foreground">No functions yet.</p>
      )}

      <FunctionDetailsSheet fn={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  )
}

function CreateFunctionDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [regionIds, setRegionIds] = useState<string[]>([])
  const [runtime, setRuntime] = useState('')
  const { data: regionsData } = useFunctionRegions()
  const primaryRegionId = regionIds[0]
  const { data: runtimesData } = useFunctionRuntimes(primaryRegionId)
  const createMutation = useCreateCaredFunction()

  const regions = regionsData?.regions ?? []
  const runtimes = runtimesData?.runtimes ?? []

  function toggleRegion(regionId: string) {
    setRegionIds((current) =>
      current.includes(regionId) ? current.filter((id) => id !== regionId) : [...current, regionId],
    )
    setRuntime('')
  }

  async function submit() {
    if (!name.trim() || !runtime || !regionIds.length) return

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        regionIds,
        runtime: runtime as never,
        enabled: true,
        logging: true,
      })
      toast.success('Function created')
      setOpen(false)
      setName('')
      setRegionIds([])
      setRuntime('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create function')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create function
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create function</DialogTitle>
          <DialogDescription>
            Select one or more regions. The first selected region is primary.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Regions</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {regions.map((region) => (
                <label
                  key={region.id}
                  className="flex items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <Checkbox
                    checked={regionIds.includes(region.id)}
                    onCheckedChange={() => toggleRegion(region.id)}
                  />
                  <span className="flex-1">{region.name}</span>
                  {regionIds[0] === region.id && <Badge variant="outline">Primary</Badge>}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Runtime</Label>
            <Select value={runtime} onValueChange={setRuntime} disabled={!primaryRegionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select runtime" />
              </SelectTrigger>
              <SelectContent>
                {runtimes.map((item) => (
                  <SelectItem key={item.$id} value={item.$id}>
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
            disabled={!name.trim() || !runtime || !regionIds.length || createMutation.isPending}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FunctionDetailsSheet({
  fn,
  onOpenChange,
}: {
  fn: CaredFunction | null
  onOpenChange: (open: boolean) => void
}) {
  const deploymentsQuery = useFunctionDeployments(fn)

  return (
    <Sheet open={!!fn} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        {fn && (
          <>
            <SheetHeader>
              <SheetTitle>{fn.name}</SheetTitle>
            </SheetHeader>
            <Tabs defaultValue="overview" className="mt-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="regions">Regions</TabsTrigger>
                <TabsTrigger value="deployments">Deployments</TabsTrigger>
                <TabsTrigger value="domains">Domains</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 pt-4">
                <InfoRow label="Runtime" value={fn.runtime} />
                <InfoRow label="Primary region" value={fn.primaryRegion.name} />
                <InfoRow
                  label="Latest deployment"
                  value={fn.primaryFunction?.latestDeploymentStatus ?? 'unknown'}
                />
              </TabsContent>
              <TabsContent value="regions" className="space-y-3 pt-4">
                {fn.regions.map((region) => (
                  <div
                    key={region.regionId}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{region.regionId}</p>
                      {fn.primaryRegionId === region.regionId && (
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
                  activeDeploymentId={fn.activeDeploymentId}
                />
              </TabsContent>
              <TabsContent value="domains" className="pt-4 text-sm text-muted-foreground">
                Custom domains are managed per region for manual triggers.
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
  deployments: FunctionDeployment[]
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
            <DeploymentMeta label="Entrypoint" value={deployment.entrypoint || '-'} />
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
