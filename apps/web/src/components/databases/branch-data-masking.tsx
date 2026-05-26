import { useEffect, useMemo, useState } from 'react'
import { Play, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { RouterInputs } from '@cared/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@cared/ui/components/alert-dialog'
import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import { Input } from '@cared/ui/components/input'

import { SectionTitle } from '@/components/section'
import {
  useDatabaseBranchAnonymizedStatus,
  useDatabaseBranchDatabases,
  useDatabaseBranchMaskingActions,
  useDatabaseBranchMaskingRules,
} from '@/hooks/use-database'
import { RelativeTime } from './database-format'

type MaskingRuleInput =
  RouterInputs['account']['database']['updateMaskingRules']['maskingRules'][number]

interface BranchDataMaskingProps {
  namespaceId: string
  branchId: string
}

function emptyRule(databaseName = ''): MaskingRuleInput {
  return {
    databaseName,
    schemaName: 'public',
    tableName: '',
    columnName: '',
    maskingFunction: 'anon.fake_email()',
  }
}

function validateRules(rules: MaskingRuleInput[]) {
  for (const rule of rules) {
    if (!rule.databaseName || !rule.schemaName || !rule.tableName || !rule.columnName) {
      return 'Database, schema, table, and column are required for every rule'
    }
    if (!rule.maskingFunction && !rule.maskingValue) {
      return 'Every rule needs either a masking function or a masking value'
    }
  }
  return null
}

export function BranchDataMasking({ namespaceId, branchId }: BranchDataMaskingProps) {
  const databases = useDatabaseBranchDatabases(namespaceId, branchId)
  const maskingRulesQuery = useDatabaseBranchMaskingRules(namespaceId, branchId)
  const statusQuery = useDatabaseBranchAnonymizedStatus(namespaceId, branchId)
  const { updateMaskingRules, startAnonymization, isPending } = useDatabaseBranchMaskingActions(
    namespaceId,
    branchId,
  )

  const [rules, setRules] = useState<MaskingRuleInput[]>([])
  const [startOpen, setStartOpen] = useState(false)

  const defaultDatabaseName = databases[0]?.name ?? ''
  const loadedRules = maskingRulesQuery.data?.maskingRules

  useEffect(() => {
    if (loadedRules) {
      setRules(loadedRules)
    }
  }, [loadedRules])

  const status = statusQuery.data?.status
  const rulesUnavailable = maskingRulesQuery.isError
  const statusUnavailable = statusQuery.isError
  const hasChanges = useMemo(
    () => JSON.stringify(rules) !== JSON.stringify(loadedRules ?? []),
    [loadedRules, rules],
  )

  const updateRule = (index: number, patch: Partial<MaskingRuleInput>) => {
    setRules((current) => current.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)))
  }

  const removeRule = (index: number) => {
    setRules((current) => current.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    const error = validateRules(rules)
    if (error) {
      toast.error(error)
      return
    }
    await updateMaskingRules(rules)
  }

  const handleStart = async () => {
    await startAnonymization()
    setStartOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title="Data Masking"
          description="Define PostgreSQL Anonymizer rules and run masking on anonymized branches."
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setRules((current) => [...current, emptyRule(defaultDatabaseName)])}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add rule
          </Button>
          <Button onClick={() => void handleSave()} disabled={!hasChanges || isPending}>
            <Save className="h-4 w-4 mr-1.5" />
            {isPending ? 'Saving…' : 'Save rules'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setStartOpen(true)}
            disabled={isPending || rules.length === 0}
          >
            <Play className="h-4 w-4 mr-1.5" />
            Start
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>
            Masking is available for branches created through Neon anonymized branch workflows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {status ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">State</p>
                <Badge variant={status.state === 'error' ? 'destructive' : 'secondary'}>
                  {status.state}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <RelativeTime value={status.updatedAt} muted={false} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last run</p>
                <RelativeTime value={status.lastRun?.startedAt} muted={false} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Masked columns</p>
                <p>{status.lastRun?.maskedColumns ?? '—'}</p>
              </div>
              {status.statusMessage && (
                <p className="sm:col-span-2 lg:col-span-4 text-muted-foreground">
                  {status.statusMessage}
                </p>
              )}
            </div>
          ) : statusUnavailable ? (
            <p className="text-muted-foreground">
              This branch does not currently report anonymized branch status.
            </p>
          ) : (
            <p className="text-muted-foreground">Loading status…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Masking rules</CardTitle>
          <CardDescription>
            Each rule targets one column and applies either an anonymizer function or a literal
            replacement value.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rulesUnavailable && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Masking rules are not available for this branch yet. Create an anonymized branch, then
              configure and run rules here.
            </div>
          )}

          {rules.map((rule, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-6"
            >
              <Input
                aria-label="Database"
                placeholder="database"
                value={rule.databaseName}
                onChange={(e) => updateRule(index, { databaseName: e.target.value })}
              />
              <Input
                aria-label="Schema"
                placeholder="schema"
                value={rule.schemaName}
                onChange={(e) => updateRule(index, { schemaName: e.target.value })}
              />
              <Input
                aria-label="Table"
                placeholder="table"
                value={rule.tableName}
                onChange={(e) => updateRule(index, { tableName: e.target.value })}
              />
              <Input
                aria-label="Column"
                placeholder="column"
                value={rule.columnName}
                onChange={(e) => updateRule(index, { columnName: e.target.value })}
              />
              <Input
                aria-label="Masking function"
                placeholder="anon.fake_email()"
                value={rule.maskingFunction ?? ''}
                onChange={(e) =>
                  updateRule(index, { maskingFunction: e.target.value || undefined })
                }
              />
              <div className="flex gap-2">
                <Input
                  aria-label="Masking value"
                  placeholder="literal value"
                  value={rule.maskingValue ?? ''}
                  onChange={(e) => updateRule(index, { maskingValue: e.target.value || undefined })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove rule"
                  onClick={() => removeRule(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {!rulesUnavailable && rules.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No masking rules configured.
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={startOpen} onOpenChange={setStartOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start anonymization?</AlertDialogTitle>
            <AlertDialogDescription>
              Neon will apply the configured masking rules to this anonymized branch. Review the
              target database, schema, table, and column names before starting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={() => void handleStart()}>
              {isPending ? 'Starting…' : 'Start anonymization'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
