import { CopyButton } from '@/components/copy-button'
import { SectionTitle } from '@/components/section'
import { useDatabaseBranchConnectionUris } from '@/hooks/use-database'

interface BranchDataApiProps {
  namespaceId: string
  branchId: string
}

export function BranchDataApi({ namespaceId, branchId }: BranchDataApiProps) {
  const connectionUris = useDatabaseBranchConnectionUris(namespaceId, branchId)

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Data API"
        description="Use these branch connection strings with Postgres drivers and Cared backend integrations."
      />

      <div className="space-y-3">
        {connectionUris.map((item) => (
          <div key={item.name} className="rounded-lg border p-4">
            <div className="mb-2 text-sm font-medium">{item.name}</div>
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
              <code className="min-w-0 flex-1 truncate text-xs">{item.url}</code>
              <CopyButton value={item.url} />
            </div>
          </div>
        ))}
        {connectionUris.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No databases are available on this branch.
          </p>
        )}
      </div>
    </div>
  )
}
