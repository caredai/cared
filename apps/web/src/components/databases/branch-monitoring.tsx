import { SectionTitle } from '@/components/section'
import { useDatabaseBranchEndpoints, useDatabaseBranches } from '@/hooks/use-database'
import { NamespaceMonitoringPanel } from './namespace-monitoring-panel'

interface BranchMonitoringProps {
  namespaceId: string
  branchId: string
}

export function BranchMonitoring({ namespaceId, branchId }: BranchMonitoringProps) {
  const branches = useDatabaseBranches(namespaceId)
  const endpoints = useDatabaseBranchEndpoints(namespaceId, branchId)

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Monitoring"
        description="Track compute allocation and memory usage for branch computes."
      />
      <NamespaceMonitoringPanel
        namespaceId={namespaceId}
        branches={branches}
        endpoints={endpoints}
      />
    </div>
  )
}
