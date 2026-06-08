import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from '@tanstack/react-router'
import { RefreshCwIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod/v4'

import type { RouterOutputs } from '@cared/api'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cared/ui/components/breadcrumb'
import { Button } from '@cared/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@cared/ui/components/field'
import { Input } from '@cared/ui/components/input'
import { CircleSpinner } from '@cared/ui/components/spinner'
import { Switch } from '@cared/ui/components/switch'
import { ToggleGroup, ToggleGroupItem } from '@cared/ui/components/toggle-group'
import { InputWithEndAction } from '@/components/input-with-end-action'
import { SectionTitle } from '@/components/section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { useAccounts } from '@/hooks/use-account'
import { useActiveAccountId } from '@/hooks/use-active'
import {
  useApiToken,
  useDeleteApiToken,
  useListPermissionGroups,
  useRotateApiToken,
  useUpdateApiToken,
} from '@/hooks/use-api-token'
import { useSessionPublic } from '@/hooks/use-session'
import { AccountApiTokenScopeFields } from './account-api-token-scope-fields'
import { ApiTokenPermissionsFields } from './api-token-permissions-fields'
import { formatMaskedApiToken } from './format-masked-api-token'
import {
  buildPoliciesFromFormValues,
  organizeAccountUserPermissions,
  organizePermissions,
  parsePoliciesToFormValues,
} from './api-token-policy-form'
import { ApiTokenTtlFields } from './api-token-ttl-fields'
import { detectTtlPreset, ttlPresetToExpiry } from './api-token-ttl'
import { ApiTokenDialog, useShowApiTokenDialog } from './show-api-token-dialog'

type ApiToken = RouterOutputs['account']['apiToken']['get']['token']

const permissionActionsSchema = z.array(z.enum(['read', 'write', 'invoke', 'publish']))

const ttlPresetSchema = z.enum(['none', '7d', '30d', '90d', '1y', 'custom'])

const apiTokenDetailSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(64, 'Name cannot exceed 64 characters'),
    accountPermissions: z.record(z.string(), permissionActionsSchema).optional(),
    userPermissions: z.record(z.string(), permissionActionsSchema).optional(),
    accountScope: z.enum(['all', 'specific']).optional(),
    accountIds: z.array(z.string()).optional(),
    accountTokenScope: z.enum(['entire', 'member']).optional(),
    memberUserId: z.string().optional(),
    enabled: z.boolean(),
    ttlPreset: ttlPresetSchema,
    dateRange: z
      .object({
        from: z.date().optional(),
        to: z.date().optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ttlPreset === 'custom' && !data.dateRange?.to) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select an expiration date',
        path: ['dateRange'],
      })
    }
  })

type ApiTokenDetailFormValues = z.infer<typeof apiTokenDetailSchema>

export function ApiTokenDetail({
  apiTokenId,
  credentialType,
  accountIdNoPrefix,
}: {
  apiTokenId: string
  credentialType: 'account' | 'user'
  accountIdNoPrefix?: string
}) {
  const { apiToken } = useApiToken(apiTokenId)

  return (
    <ApiTokenDetailContent
      apiToken={apiToken}
      credentialType={credentialType}
      accountIdNoPrefix={accountIdNoPrefix}
    />
  )
}

function ApiTokenDetailContent({
  apiToken,
  credentialType,
  accountIdNoPrefix,
}: {
  apiToken: ApiToken
  credentialType: 'account' | 'user'
  accountIdNoPrefix?: string
}) {
  const router = useRouter()
  const { showApiTokenDialog } = useShowApiTokenDialog()
  const { updateApiToken, isUpdating } = useUpdateApiToken()
  const rotateApiToken = useRotateApiToken()
  const deleteApiToken = useDeleteApiToken()
  const {
    data: { permissionGroups },
  } = useListPermissionGroups()
  const accounts = useAccounts()
  const { session } = useSessionPublic()
  const { activeAccountId } = useActiveAccountId()

  const [showRotateDialog, setShowRotateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const organizedPermissions = useMemo(
    () => organizePermissions(permissionGroups),
    [permissionGroups],
  )

  const organizedAccountUserPermissions = useMemo(
    () => organizeAccountUserPermissions(permissionGroups),
    [permissionGroups],
  )

  const parsedPolicies = useMemo(
    () => parsePoliciesToFormValues(apiToken.policies, permissionGroups, credentialType),
    [apiToken.policies, credentialType, permissionGroups],
  )

  const initialTtlPreset = useMemo(
    () => detectTtlPreset(apiToken.notBefore, apiToken.expiresAt),
    [apiToken.notBefore, apiToken.expiresAt],
  )

  const initialDateRange = useMemo(() => {
    if (initialTtlPreset !== 'custom') return undefined
    return {
      from: apiToken.notBefore ?? undefined,
      to: apiToken.expiresAt ?? undefined,
    }
  }, [apiToken.expiresAt, apiToken.notBefore, initialTtlPreset])

  const form = useForm<ApiTokenDetailFormValues>({
    resolver: zodResolver(apiTokenDetailSchema),
    defaultValues: {
      name: apiToken.name,
      accountPermissions: parsedPolicies.accountPermissions,
      userPermissions: parsedPolicies.userPermissions,
      accountScope: parsedPolicies.accountScope,
      accountIds: parsedPolicies.accountIds,
      accountTokenScope: parsedPolicies.accountTokenScope ?? 'entire',
      memberUserId: parsedPolicies.memberUserId ?? apiToken.userId ?? undefined,
      enabled: apiToken.enabled,
      ttlPreset: initialTtlPreset,
      dateRange: initialDateRange,
    },
  })

  useEffect(() => {
    form.reset({
      name: apiToken.name,
      accountPermissions: parsedPolicies.accountPermissions,
      userPermissions: parsedPolicies.userPermissions,
      accountScope: parsedPolicies.accountScope,
      accountIds: parsedPolicies.accountIds,
      accountTokenScope: parsedPolicies.accountTokenScope ?? 'entire',
      memberUserId: parsedPolicies.memberUserId ?? apiToken.userId ?? undefined,
      enabled: apiToken.enabled,
      ttlPreset: initialTtlPreset,
      dateRange: initialDateRange,
    })
  }, [
    apiToken.enabled,
    apiToken.expiresAt,
    apiToken.name,
    apiToken.notBefore,
    form,
    initialDateRange,
    initialTtlPreset,
    parsedPolicies.accountIds,
    parsedPolicies.accountPermissions,
    parsedPolicies.accountScope,
    parsedPolicies.accountTokenScope,
    parsedPolicies.memberUserId,
    parsedPolicies.userPermissions,
    apiToken.userId,
  ])

  const listPath =
    credentialType === 'account' && accountIdNoPrefix
      ? '/acc_{$accountIdNoPrefix}/api-tokens'
      : '/user/api-tokens'

  const navigateToList = useCallback(() => {
    if (credentialType === 'account' && accountIdNoPrefix) {
      void router.navigate({
        to: '/acc_{$accountIdNoPrefix}/api-tokens',
        params: { accountIdNoPrefix },
      })
      return
    }

    void router.navigate({ to: '/user/api-tokens' })
  }, [accountIdNoPrefix, credentialType, router])

  const onSubmit = async (data: ApiTokenDetailFormValues) => {
    if (
      credentialType === 'account' &&
      data.accountTokenScope === 'member' &&
      !data.memberUserId
    ) {
      form.setError('memberUserId', { message: 'Select a member' })
      return
    }

    const policies = buildPoliciesFromFormValues({
      credentialType,
      permissionGroups,
      accountPermissions: data.accountPermissions,
      userPermissions: data.userPermissions,
      accountScope: data.accountScope,
      accountIds: data.accountIds,
      accountTokenScope: data.accountTokenScope,
      memberUserId: data.memberUserId,
      activeAccountId,
      userId: session?.userId,
    })

    if (policies.length === 0) {
      form.setError('root', {
        message: 'At least one permission must be selected',
      })
      return
    }

    const ttl = ttlPresetToExpiry(data.ttlPreset, data.dateRange)

    await updateApiToken({
      id: apiToken.id,
      name: data.name.trim(),
      policies,
      enabled: data.enabled,
      expiresAt: ttl?.expiresAt ?? null,
      notBefore: ttl?.notBefore ?? null,
    })
    toast.success('API token updated')
  }

  const handleRotate = async () => {
    try {
      setIsRotating(true)
      const result = await rotateApiToken(apiToken.id)
      showApiTokenDialog(result.token.token)
      setShowRotateDialog(false)
    } finally {
      setIsRotating(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteApiToken(apiToken.id)
      toast.success('API token deleted')
      navigateToList()
    } finally {
      setIsDeleting(false)
    }
  }

  const isDirty = form.formState.isDirty

  return (
    <>
      <SectionTitle
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  {credentialType === 'account' && accountIdNoPrefix ? (
                    <Link to={listPath} params={{ accountIdNoPrefix }}>
                      API Tokens
                    </Link>
                  ) : (
                    <Link to={listPath}>API Tokens</Link>
                  )}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0 max-w-sm">
                <BreadcrumbPage className="text-2xl font-bold truncate min-w-0">
                  {apiToken.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-8 pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="max-w-3xl">
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter API token name"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Field className="max-w-3xl">
                <FieldLabel htmlFor="api-token-value">API Token</FieldLabel>
                <FieldDescription>
                  The full token value is only shown when the token is created or regenerated.
                </FieldDescription>
                <InputWithEndAction
                  id="api-token-value"
                  value={formatMaskedApiToken(apiToken.start, apiToken.end)}
                  readOnly
                  className="font-mono"
                  endAction={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 shrink-0 text-primary"
                      onClick={() => setShowRotateDialog(true)}
                    >
                      Regenerate
                    </Button>
                  }
                />
              </Field>

              {credentialType === 'user' ? (
                <Tabs defaultValue="account" className="w-full">
                  <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="user">User</TabsTrigger>
                  </TabsList>
                  <TabsContent value="account" className="space-y-6 mt-4">
                    <ApiTokenPermissionsFields
                      control={form.control}
                      permScope="account"
                      permissions={organizedPermissions.accountPerms}
                    />
                    <div className="space-y-4">
                      <Controller
                        name="accountScope"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel className="text-base font-semibold">Accounts</FieldLabel>
                            <FieldContent>
                              <ToggleGroup
                                type="single"
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value || 'all')
                                }}
                                variant="outline"
                                aria-invalid={fieldState.invalid}
                              >
                                <ToggleGroupItem
                                  value="all"
                                  aria-label="All Accounts"
                                  className="flex-none"
                                >
                                  All Accounts
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="specific"
                                  aria-label="Specific Accounts"
                                  className="flex-none"
                                >
                                  Specific Accounts
                                </ToggleGroupItem>
                              </ToggleGroup>
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </FieldContent>
                          </Field>
                        )}
                      />
                      {form.watch('accountScope') === 'specific' && (
                        <Controller
                          name="accountIds"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel>Select Accounts</FieldLabel>
                              <FieldContent>
                                <div className="flex flex-wrap gap-2">
                                  {accounts.map((account) => {
                                    const accountIds = field.value ?? []
                                    const isSelected = accountIds.includes(account.id)
                                    return (
                                      <Button
                                        key={account.id}
                                        type="button"
                                        variant={isSelected ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          const current = accountIds
                                          if (isSelected) {
                                            field.onChange(
                                              current.filter((id) => id !== account.id),
                                            )
                                          } else {
                                            field.onChange([...current, account.id])
                                          }
                                        }}
                                      >
                                        {account.name}
                                      </Button>
                                    )
                                  })}
                                </div>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </FieldContent>
                            </Field>
                          )}
                        />
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="user" className="space-y-6 mt-4">
                    <ApiTokenPermissionsFields
                      control={form.control}
                      permScope="user"
                      permissions={organizedPermissions.userPerms}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <AccountApiTokenScopeFields
                  control={form.control}
                  setValue={form.setValue}
                  organizedAccountPermissions={organizedPermissions.accountPerms}
                  organizedAccountUserPermissions={
                    organizedAccountUserPermissions.accountUserPerms
                  }
                />
              )}

              <Controller
                name="enabled"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="horizontal"
                    className="items-center justify-between"
                  >
                    <FieldContent>
                      <FieldLabel htmlFor={`${field.name}-switch`} className="text-base">
                        Enabled
                      </FieldLabel>
                      <FieldDescription>Enable or disable this API token</FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </FieldContent>
                    <Switch
                      id={`${field.name}-switch`}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                  </Field>
                )}
              />

              <ApiTokenTtlFields
                control={form.control}
                setValue={form.setValue}
                wrapperClassName="max-w-3xl"
              />

              {form.formState.errors.root && (
                <FieldError errors={[form.formState.errors.root]} />
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating || !isDirty}>
                  {isUpdating ? (
                    <>
                      <CircleSpinner />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this API token. Applications using it will lose access immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              Delete API Token
            </Button>
          </CardContent>
        </Card>
      </div>

      <ApiTokenDialog />

      <Dialog
        open={showRotateDialog}
        onOpenChange={(open) => {
          if (!isRotating) {
            setShowRotateDialog(open)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate this API token? This will invalidate the current
              token and generate a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRotateDialog(false)}
              disabled={isRotating}
            >
              Cancel
            </Button>
            <Button variant="default" onClick={() => void handleRotate()} disabled={isRotating}>
              {isRotating ? (
                <>
                  <CircleSpinner />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCwIcon className="h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setShowDeleteDialog(open)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{apiToken.name}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <CircleSpinner />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
