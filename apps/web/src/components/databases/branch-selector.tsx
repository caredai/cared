import { useEffect } from 'react'
import { useNavigate, useRouterState, useSearch } from '@tanstack/react-router'
import { GitBranch } from 'lucide-react'

import { Label } from '@cared/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'

import { useDatabaseBranches } from '@/hooks/use-database'
import { branchSearchSchema } from './branch-search'

interface BranchSelectorProps {
  namespaceId: string
}

/** Sidebar branch picker; persists selection in the `branch` search param. */
export function BranchSelector({ namespaceId }: BranchSelectorProps) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const search = useSearch({ strict: false })
  const parsed = branchSearchSchema.safeParse(search)
  const selectedBranchId = parsed.success ? parsed.data.branch : undefined

  const branches = useDatabaseBranches(namespaceId)

  const defaultBranchId = branches.find((b) => b.name === 'production')?.id ?? branches.at(0)?.id

  useEffect(() => {
    if (!defaultBranchId || selectedBranchId) return
    void navigate({
      to: pathname,
      search: (prev: Record<string, unknown>) => ({ ...prev, branch: defaultBranchId }),
      replace: true,
    })
  }, [defaultBranchId, selectedBranchId, navigate, pathname])

  if (branches.length === 0) {
    return <p className="text-xs text-muted-foreground px-1">No branches</p>
  }

  return (
    <div className="space-y-1.5 w-full min-w-0">
      <Label className="text-xs text-muted-foreground px-1">Branch</Label>
      <Select
        value={selectedBranchId ?? defaultBranchId ?? ''}
        onValueChange={(branchId) => {
          void navigate({
            to: pathname,
            search: (prev: Record<string, unknown>) => ({ ...prev, branch: branchId }),
          })
        }}
      >
        <SelectTrigger className="px-2 h-8 w-full text-md">
          <div className="flex min-w-0 items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 shrink-0" />
            <SelectValue placeholder="Select branch" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id} className="text-md">
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function BranchSelectorSkeleton() {
  return <div className="h-8 rounded-md bg-muted animate-pulse" />
}
