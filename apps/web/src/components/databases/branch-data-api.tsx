import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  Check,
  Circle,
  ExternalLink,
  GitBranch,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react'

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
import { Alert, AlertDescription } from '@cared/ui/components/alert'
import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Card, CardContent } from '@cared/ui/components/card'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { Switch } from '@cared/ui/components/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cared/ui/components/tabs'
import { Textarea } from '@cared/ui/components/textarea'
import { cn } from '@cared/ui/lib/utils'

import { CopyButton } from '@/components/copy-button'
import { DataApiEnableDiagram } from '@/components/databases/data-api-enable-diagram'
import { SectionTitle } from '@/components/section'
import {
  useDatabaseBranch,
  useDatabaseBranchDataApi,
  useDatabaseBranchDataApiActions,
  useDatabaseBranchDataApis,
  useDatabaseBranchDatabases,
  useDatabaseBranchNeonAuth,
  useDatabaseBranchTablesWithoutRls,
  useDatabaseJwks,
} from '@/hooks/use-database'

type DataApiSettingsInput =
  RouterInputs['account']['database']['updateBranchDataApi']['settings']

interface BranchDataApiProps {
  namespaceId: string
  branchId: string
  accountIdNoPrefix: string
  namespaceIdNoPrefix: string
}

const OPENAPI_MODE_OPTIONS = [
  { value: 'disabled', label: 'Disabled' },
  { value: 'ignore-privileges', label: 'Ignore privileges' },
] as const

function DataApiSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-4 border-b pb-8 last:border-b-0 lg:grid-cols-[minmax(0,240px)_1fr] lg:gap-8">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}

function SchemaTagsInput({
  schemas,
  onChange,
  disabled,
}: {
  schemas: string[]
  onChange: (schemas: string[]) => void
  disabled?: boolean
}) {
  const [draft, setDraft] = useState('')

  const addSchema = () => {
    const value = draft.trim()
    if (!value || schemas.includes(value)) {
      setDraft('')
      return
    }
    onChange([...schemas, value])
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap gap-2 rounded-md border bg-background px-3 py-2">
        {schemas.map((schema) => (
          <Badge key={schema} variant="secondary" className="gap-1 pr-1">
            {schema}
            <button
              type="button"
              className="rounded-sm hover:bg-muted"
              disabled={disabled}
              aria-label={`Remove schema ${schema}`}
              onClick={() => onChange(schemas.filter((entry) => entry !== schema))}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addSchema()
            }
          }}
          onBlur={addSchema}
          placeholder="Add schema"
          className="h-7 min-w-[8rem] flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <p className="text-xs text-muted-foreground">Database schemas to expose via the API</p>
    </div>
  )
}

function defaultSettings(): DataApiSettingsInput {
  return {
    dbSchemas: ['public'],
    dbAnonRole: 'anonymous',
    openapiMode: 'disabled',
    serverTimingEnabled: false,
  }
}

function settingsFromDataApi(
  settings: ReturnType<typeof useDatabaseBranchDataApi>['settings'],
): DataApiSettingsInput {
  return {
    dbSchemas: settings?.dbSchemas?.length ? settings.dbSchemas : ['public'],
    dbAnonRole: settings?.dbAnonRole ?? 'anonymous',
    dbMaxRows: settings?.dbMaxRows,
    serverCorsAllowedOrigins: settings?.serverCorsAllowedOrigins,
    openapiMode: settings?.openapiMode ?? 'disabled',
    serverTimingEnabled: settings?.serverTimingEnabled ?? false,
  }
}

function BranchDataApiContent({
  namespaceId,
  branchId,
  databaseName,
  accountIdNoPrefix,
  namespaceIdNoPrefix,
}: {
  namespaceId: string
  branchId: string
  databaseName: string
  accountIdNoPrefix: string
  namespaceIdNoPrefix: string
}) {
  const dataApi = useDatabaseBranchDataApi(namespaceId, branchId, databaseName)
  const neonAuth = useDatabaseBranchNeonAuth(namespaceId, branchId)
  const jwks = useDatabaseJwks(namespaceId, branchId)
  const tablesWithoutRls = useDatabaseBranchTablesWithoutRls(
    namespaceId,
    branchId,
    databaseName,
    dataApi.enabled,
  )
  const { createDataApi, updateDataApi, refreshSchemaCache, deleteDataApi, isPending } =
    useDatabaseBranchDataApiActions(namespaceId, branchId)

  const [settings, setSettings] = useState<DataApiSettingsInput>(() => defaultSettings())
  const [disableOpen, setDisableOpen] = useState(false)

  useEffect(() => {
    if (dataApi.enabled) {
      setSettings(settingsFromDataApi(dataApi.settings))
    }
  }, [dataApi.enabled, dataApi.status, dataApi.url, databaseName])

  const hasSettingsChanges = useMemo(() => {
    if (!dataApi.enabled) return false
    return JSON.stringify(settings) !== JSON.stringify(settingsFromDataApi(dataApi.settings))
  }, [dataApi.enabled, dataApi.settings, settings])

  const unprotectedTables = useMemo(
    () =>
      tablesWithoutRls.map((row: Record<string, unknown>) => {
        const schema = String(row.schema_name ?? '')
        const table = String(row.table_name ?? '')
        return schema && table ? `${schema}.${table}` : ''
      }).filter(Boolean),
    [tablesWithoutRls],
  )

  const handleSaveSettings = async () => {
    await updateDataApi(databaseName, settings)
  }

  const handleRefreshSchema = async () => {
    await refreshSchemaCache(databaseName, settingsFromDataApi(dataApi.settings))
  }

  if (!dataApi.enabled) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <DataApiEnableDiagram />

          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Data API</h3>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Instantly generate a REST API on top of your database. Query tables, views, and
              functions in standard HTTP requests, with zero backend code required.
            </p>
          </div>

          <div className="w-full max-w-2xl space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-sm border bg-foreground text-background">
                <Check className="h-3 w-3" />
              </div>
              <div>
                <p className="text-sm font-medium">Use Neon Auth</p>
                <p className="text-xs text-muted-foreground">
                  Manage sign-up, login and account access to the Data API. It issues JWTs for API
                  requests.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-sm border bg-foreground text-background">
                <Check className="h-3 w-3" />
              </div>
              <div>
                <p className="text-sm font-medium">Grant public schema access</p>
                <p className="text-xs text-muted-foreground">
                  Applies grants so authenticated users can read and write to tables in the public
                  schema. Once enabled, add Row-Level Security policies to define which rows they
                  can access.
                </p>
              </div>
            </div>
          </div>

          <Button disabled={isPending} onClick={() => void createDataApi(databaseName)}>
            Enable Data API
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="api" className="space-y-6">
      <TabsList>
        <TabsTrigger value="api">API</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="api" className="space-y-0">
        <div className="space-y-8">
          <DataApiSection
            title="API"
            description="Access your database through auto-generated REST API endpoints."
          >
            <p className="text-sm text-muted-foreground">
              The Data API is enabled for this branch and database.
            </p>
          </DataApiSection>

          <DataApiSection
            title="API URL"
            description="Provides read-write access to tables without Row Level Security enabled."
          >
            <div className="space-y-4">
              {dataApi.url ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                  <code className="min-w-0 flex-1 truncate text-xs">{dataApi.url}</code>
                  <CopyButton value={dataApi.url} />
                </div>
              ) : null}
              <p className="text-sm text-muted-foreground">
                To read and write data with the Data API, set up authentication and RLS policies.{' '}
                <a
                  href="https://neon.com/docs/guides/neon-data-api"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  Learn more
                </a>
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => void handleRefreshSchema()}
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Refresh schema cache
                </Button>
                <p className="text-xs text-muted-foreground">
                  If you have made changes to the database schema, refresh the schema cache to
                  apply them immediately.
                </p>
              </div>
            </div>
          </DataApiSection>

          <DataApiSection
            title="Security"
            description="To build apps that use the Data API, configure authentication for your users and Row-Level Security in Postgres."
          >
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    {neonAuth.ready ? (
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {neonAuth.ready ? 'Neon Auth is ready' : 'Neon Auth is not configured'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Go to the Auth page for instructions on configuring authentication for your
                        application.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to="/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/auth"
                      params={{ accountIdNoPrefix, namespaceIdNoPrefix }}
                      search={{ branch: branchId }}
                    >
                      Auth
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>

                <div className="flex items-start justify-between gap-4 border-t pt-4">
                  <div className="flex gap-3">
                    {unprotectedTables.length === 0 ? (
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Protect your data</p>
                      <p className="text-sm text-muted-foreground">
                        Protect all your tables with Row-Level Security.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to="/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/data-editor"
                      params={{ accountIdNoPrefix, namespaceIdNoPrefix }}
                      search={{ branch: branchId }}
                    >
                      Enable RLS
                    </Link>
                  </Button>
                </div>

                {unprotectedTables.length > 0 && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {unprotectedTables.join(', ')} have RLS disabled. All authenticated users can
                      view all rows in these table(s).
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </DataApiSection>
        </div>
      </TabsContent>

      <TabsContent value="settings" className="space-y-8">
        <DataApiSection
          title="Authentication"
          description="Configure authentication providers for the Data API"
        >
          <Card>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Neon Auth</p>
                <p className="text-sm text-muted-foreground">
                  {neonAuth.ready
                    ? 'Neon Auth is configured for this branch.'
                    : 'Enable Neon Auth or add external JWT providers.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to="/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/auth"
                    params={{ accountIdNoPrefix, namespaceIdNoPrefix }}
                    search={{ branch: branchId }}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add provider
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          {jwks.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {jwks.length} external provider{jwks.length === 1 ? '' : 's'} configured on this
              branch.
            </p>
          )}
        </DataApiSection>

        <DataApiSection
          title="Advanced settings"
          description="Configure database access, schema exposure, and API behavior."
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Exposed schemas</Label>
              <SchemaTagsInput
                schemas={settings.dbSchemas ?? ['public']}
                disabled={isPending}
                onChange={(dbSchemas) =>
                  setSettings((current: DataApiSettingsInput) => ({ ...current, dbSchemas }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-api-anon-role">Anonymous role</Label>
              <Input
                id="data-api-anon-role"
                value={settings.dbAnonRole ?? 'anonymous'}
                disabled={isPending}
                onChange={(event) =>
                  setSettings((current: DataApiSettingsInput) => ({
                    ...current,
                    dbAnonRole: event.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Database role used for unauthenticated requests
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-api-max-rows">Maximum rows</Label>
              <Input
                id="data-api-max-rows"
                type="number"
                min={1}
                placeholder="e.g., 1000"
                value={settings.dbMaxRows ?? ''}
                disabled={isPending}
                onChange={(event) => {
                  const value = event.target.value
                  setSettings((current: DataApiSettingsInput) => ({
                    ...current,
                    dbMaxRows: value ? Number.parseInt(value, 10) : undefined,
                  }))
                }}
              />
              <p className="text-xs text-muted-foreground">
                Limit the number of rows returned per request
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-api-cors">CORS allowed origins</Label>
              <Textarea
                id="data-api-cors"
                placeholder="e.g., https://example.com, https://app.example.com"
                value={settings.serverCorsAllowedOrigins ?? ''}
                disabled={isPending}
                onChange={(event) =>
                  setSettings((current: DataApiSettingsInput) => ({
                    ...current,
                    serverCorsAllowedOrigins: event.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of allowed origins for cross-origin requests
              </p>
            </div>

            <div className="space-y-2">
              <Label>OpenAPI specification</Label>
              <Select
                value={settings.openapiMode ?? 'disabled'}
                disabled={isPending}
                onValueChange={(openapiMode) =>
                  setSettings((current: DataApiSettingsInput) => ({ ...current, openapiMode }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPENAPI_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Controls OpenAPI spec generation</p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Server timing headers</p>
                <p className="text-sm text-muted-foreground">
                  Include timing information in response headers for debugging
                </p>
              </div>
              <Switch
                checked={settings.serverTimingEnabled ?? false}
                disabled={isPending}
                onCheckedChange={(serverTimingEnabled) =>
                  setSettings((current: DataApiSettingsInput) => ({
                    ...current,
                    serverTimingEnabled,
                  }))
                }
              />
            </div>

            <Button
              disabled={isPending || !hasSettingsChanges}
              onClick={() => void handleSaveSettings()}
            >
              Save
            </Button>
          </div>
        </DataApiSection>

        <DataApiSection
          title="Disable"
          description="Disables the Data API for this branch. This will immediately terminate all active connections and block access to data for any apps, websites, or services using the API."
        >
          <Button variant="destructive" onClick={() => setDisableOpen(true)}>
            Disable
          </Button>
        </DataApiSection>
      </TabsContent>

      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Data API?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the Data API endpoint for database &quot;{databaseName}&quot;. Active
              HTTP clients using this endpoint will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn('bg-destructive text-destructive-foreground hover:bg-destructive/90')}
              disabled={isPending}
              onClick={() => void deleteDataApi(databaseName).then(() => setDisableOpen(false))}
            >
              {isPending ? 'Disabling…' : 'Disable Data API'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}

export function BranchDataApi({
  namespaceId,
  branchId,
  accountIdNoPrefix,
  namespaceIdNoPrefix,
}: BranchDataApiProps) {
  const branch = useDatabaseBranch(namespaceId, branchId)
  const databases = useDatabaseBranchDatabases(namespaceId, branchId)
  const dataApis = useDatabaseBranchDataApis(namespaceId, branchId)
  const [databaseName, setDatabaseName] = useState('')

  useEffect(() => {
    if (!databaseName && databases.length > 0) {
      setDatabaseName(databases[0]?.name ?? '')
    }
  }, [databaseName, databases])

  const selectedDataApi = dataApis.find((entry) => entry.databaseName === databaseName)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SectionTitle
            title="Data API"
            description="Expose this branch through Neon Data API REST endpoints."
          />
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground md:pl-0">
            <GitBranch className="h-4 w-4" />
            <span>{branch.name}</span>
            {databaseName && (
              <Badge variant={selectedDataApi?.enabled ? 'default' : 'secondary'}>
                {selectedDataApi?.enabled ? selectedDataApi.status ?? 'active' : 'disabled'}
              </Badge>
            )}
          </div>
        </div>

        {databases.length > 1 && (
          <div className="w-full sm:w-56">
            <Label htmlFor="data-api-database" className="sr-only">
              Database
            </Label>
            <Select value={databaseName} onValueChange={setDatabaseName}>
              <SelectTrigger id="data-api-database">
                <SelectValue placeholder="Select database" />
              </SelectTrigger>
              <SelectContent>
                {databases.map((database) => (
                  <SelectItem key={database.id} value={database.name}>
                    {database.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {databaseName ? (
        <BranchDataApiContent
          namespaceId={namespaceId}
          branchId={branchId}
          databaseName={databaseName}
          accountIdNoPrefix={accountIdNoPrefix}
          namespaceIdNoPrefix={namespaceIdNoPrefix}
        />
      ) : (
        <p className="text-sm text-muted-foreground">No databases are available on this branch.</p>
      )}
    </div>
  )
}
