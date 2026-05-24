import { Suspense } from 'react'
import { useSearch } from '@tanstack/react-router'
import {
  Activity,
  ArchiveRestore,
  Eye,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  Settings2,
  Table2,
  VenetianMask,
  Webhook,
} from 'lucide-react'

import { NavMain } from '@/components/app-sidebar/nav-main'
import { branchSearchSchema } from '@/components/databases/branch-search'
import { BranchSelector, BranchSelectorSkeleton } from '@/components/databases/branch-selector'

const namespaceItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Branches',
    url: '/branches',
    icon: GitBranch,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings2,
  },
]

const branchItems = [
  {
    title: 'Overview',
    url: '/overview',
    icon: Eye,
  },
  {
    title: 'Monitoring',
    url: '/monitoring',
    icon: Activity,
  },
  {
    title: 'Data Editor',
    url: '/data-editor',
    icon: Table2,
  },
  {
    title: 'Backup & Restore',
    url: '/backup-restore',
    icon: ArchiveRestore,
  },
  {
    title: 'Data Masking',
    url: '/data-masking',
    icon: VenetianMask,
  },
  {
    title: 'Data API',
    url: '/data-api',
    icon: Webhook,
  },
  {
    title: 'Auth',
    url: '/auth',
    icon: KeyRound,
  },
]

export function DatabaseNavMain({
  baseUrl,
  namespaceId,
}: {
  baseUrl: string
  namespaceId: string
}) {
  const search = useSearch({ strict: false })
  const parsed = branchSearchSchema.safeParse(search)
  const branchId = parsed.success ? parsed.data.branch : undefined
  const secondaryLinkSearch = branchId ? { branch: branchId } : undefined

  return (
    <NavMain
      items={namespaceItems}
      secondaryItems={branchItems}
      secondaryLinkSearch={secondaryLinkSearch}
      midSection={
        <Suspense fallback={<BranchSelectorSkeleton />}>
          <BranchSelector namespaceId={namespaceId} />
        </Suspense>
      }
      baseUrl={baseUrl}
    />
  )
}
