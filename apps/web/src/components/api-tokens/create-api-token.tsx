'use client'

import type { DateRange } from 'react-day-picker'
import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { format } from 'date-fns'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod/v4'

import { Button } from '@cared/ui/components/button'
import { Calendar } from '@cared/ui/components/calendar'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@cared/ui/components/field'
import { Input } from '@cared/ui/components/input'
import { Popover, PopoverContent, PopoverTrigger } from '@cared/ui/components/popover'
import { CircleSpinner } from '@cared/ui/components/spinner'
import { Switch } from '@cared/ui/components/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@cared/ui/components/table'
import { ToggleGroup, ToggleGroupItem } from '@cared/ui/components/toggle-group'
import { cn } from '@cared/ui/lib/utils'

import { useAccounts } from '@/hooks/use-account'
import { useActiveAccountId } from '@/hooks/use-active'
import { useCreateApiToken, useListPermissionGroups } from '@/hooks/use-api-token'
import { useSessionPublic } from '@/hooks/use-session'

import { useShowApiTokenDialog } from './show-api-token-dialog'

// Permission action: 'none' | 'read' | 'write' | 'invoke' | 'publish'
type PermissionAction = 'none' | 'read' | 'write' | 'invoke' | 'publish'

// Form schema for creating API token
const createApiTokenSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64, 'Name cannot exceed 64 characters'),
  // Permissions organized by scope and resource name
  // Each resource stores the selected action (or 'none' if not selected)
  accountPermissions: z.record(z.string(), z.enum(['none', 'read', 'write', 'invoke', 'publish'])).optional(),
  userPermissions: z.record(z.string(), z.enum(['none', 'read', 'write', 'invoke', 'publish'])).optional(),
  // Account selection for user scope
  accountScope: z.enum(['all', 'specific']).optional(),
  accountIds: z.array(z.string()).optional(),
  enabled: z.boolean(),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
})

type CreateApiTokenFormValues = z.infer<typeof createApiTokenSchema>

export function CreateApiToken({ scope }: { scope: 'account' | 'user' }) {
  const router = useRouter()
  const { showApiTokenDialog } = useShowApiTokenDialog()
  const [isCreating, setIsCreating] = useState(false)

  const createApiToken = useCreateApiToken()
  const {
    data: { permissionGroups },
  } = useListPermissionGroups()
  const accounts = useAccounts()
  const { session } = useSessionPublic()
  const { activeAccountId } = useActiveAccountId()

  // Organize permissions by scope and resource name
  // Each permission group has one statement with one action
  // We collect all available actions for each resource
  const organizedPermissions = useMemo(() => {
    const accountPerms: Record<string, { actions: string[] }> = {}
    const userPerms: Record<string, { actions: string[] }> = {}

    permissionGroups.forEach((group) => {
      // Ignore AI-only groups
      const hasAccount = group.scopes.includes('dev.cared.api.account')
      const hasUser = group.scopes.includes('dev.cared.api.user')
      const onlyAi = group.scopes.includes('dev.cared.api.ai') && !hasAccount && !hasUser

      if (onlyAi) return

      // Each group has one statement with one resource name
      const resourceName = Object.keys(group.statements)[0]
      if (!resourceName) return

      // Each statement value is an array with one action
      const actions = group.statements[resourceName as keyof typeof group.statements] ?? []
      const action = actions[0] // Get the first (and only) action
      if (!action) return

      const groupScope = group.scopes.find((s) =>
        ['dev.cared.api.user', 'dev.cared.api.account'].includes(s),
      )

      if (!groupScope) return

      if (groupScope === 'dev.cared.api.account') {
        accountPerms[resourceName] ??= { actions: [] }
        const accountActions = accountPerms[resourceName].actions
        if (!accountActions.includes(action)) {
          accountActions.push(action)
        }
      } else if (groupScope === 'dev.cared.api.user') {
        userPerms[resourceName] ??= { actions: [] }
        const userActions = userPerms[resourceName].actions
        if (!userActions.includes(action)) {
          userActions.push(action)
        }
      }
    })

    return { accountPerms, userPerms }
  }, [permissionGroups])

  // Initialize default permissions for all resources
  // Each resource stores one selected action (default: 'none')
  const initializePermissions = useMemo(() => {
    const accountPerms: Record<string, PermissionAction> = {}
    const userPerms: Record<string, PermissionAction> = {}

    Object.keys(organizedPermissions.accountPerms).forEach((resourceName) => {
      accountPerms[resourceName] = 'none'
    })

    Object.keys(organizedPermissions.userPerms).forEach((resourceName) => {
      userPerms[resourceName] = 'none'
    })

    return { accountPerms, userPerms }
  }, [organizedPermissions])

  const form = useForm<CreateApiTokenFormValues>({
    resolver: zodResolver(createApiTokenSchema),
    defaultValues: {
      name: '',
      accountPermissions: initializePermissions.accountPerms,
      userPermissions: initializePermissions.userPerms,
      accountScope: scope === 'user' ? 'all' : undefined,
      accountIds: [],
      enabled: true,
      dateRange: undefined,
    },
  })

  // Helper function to get permission group ID by resource name and action
  // Each group has one statement with one action
  const getPermissionGroupId = (
    resourceName: string,
    action: string,
    permScope: 'dev.cared.api.account' | 'dev.cared.api.user',
  ) => {
    return permissionGroups.find(
      (group) =>
        group.scopes.includes(permScope) &&
        Object.keys(group.statements)[0] === resourceName &&
        group.statements[resourceName as keyof typeof group.statements]?.[0] === action,
    )?.id
  }

  const onSubmit = async (data: CreateApiTokenFormValues) => {
    try {
      setIsCreating(true)

      // Build policies from form data
      const policies: {
        effect: 'allow' | 'deny'
        resources: Record<string, '*'>
        permissionGroups: { id: string }[]
      }[] = []

      // Process account permissions
      if (data.accountPermissions) {
        const accountPermissionGroupIds: string[] = []
        Object.entries(data.accountPermissions).forEach(([resourceName, action]) => {
          if (action !== 'none') {
            const groupId = getPermissionGroupId(resourceName, action, 'dev.cared.api.account')
            if (groupId) {
              accountPermissionGroupIds.push(groupId)
            }
          }
        })

        if (accountPermissionGroupIds.length > 0) {
          const policyResources: Record<string, '*'> = {}
          if (scope === 'account') {
            // For account scope, use current account
            if (activeAccountId) {
              policyResources[`dev.cared.api.account.${activeAccountId}`] = '*'
            }
          } else {
            // For user scope, use account selection
            if (data.accountScope === 'all') {
              policyResources['dev.cared.api.account.*'] = '*'
            } else if (data.accountIds && data.accountIds.length > 0) {
              data.accountIds.forEach((accountId) => {
                policyResources[`dev.cared.api.account.${accountId}`] = '*'
              })
            } else {
              // Default to all accounts if no specific selection
              policyResources['dev.cared.api.account.*'] = '*'
            }
          }

          if (Object.keys(policyResources).length > 0) {
            policies.push({
              effect: 'allow',
              resources: policyResources,
              permissionGroups: accountPermissionGroupIds.map((id) => ({ id })),
            })
          }
        }
      }

      // Process user permissions
      if (data.userPermissions && scope === 'user' && session?.userId) {
        const userPermissionGroupIds: string[] = []
        Object.entries(data.userPermissions).forEach(([resourceName, action]) => {
          if (action !== 'none') {
            const groupId = getPermissionGroupId(resourceName, action, 'dev.cared.api.user')
            if (groupId) {
              userPermissionGroupIds.push(groupId)
            }
          }
        })

        if (userPermissionGroupIds.length > 0) {
          policies.push({
            effect: 'allow',
            resources: {
              [`dev.cared.api.user.${session.userId}`]: '*',
            },
            permissionGroups: userPermissionGroupIds.map((id) => ({ id })),
          })
        }
      }

      if (policies.length === 0) {
        throw new Error('At least one permission must be selected')
      }

      const result = await createApiToken({
        name: data.name,
        scope,
        policies,
        enabled: data.enabled,
        expiresAt: data.dateRange?.to,
        notBefore: data.dateRange?.from,
      })

      showApiTokenDialog(result.token.token, 'api-token')
      form.reset()

      // Navigate back after a short delay
      setTimeout(() => {
        router.history.back()
      }, 2000)
    } catch (error) {
      console.error('Failed to create API token:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  // Render permissions list for a given scope
  const renderPermissions = (permScope: 'account' | 'user') => {
    const permissions = permScope === 'account' ? organizedPermissions.accountPerms : organizedPermissions.userPerms
    const formFieldName = permScope === 'account' ? 'accountPermissions' : 'userPermissions'

    return (
      <div className="space-y-4">
        <FieldLabel className="text-base font-semibold">Permissions</FieldLabel>
        <Table>
          <TableBody>
            {Object.keys(permissions).map((resourceName) => {
              const actions = permissions[resourceName]?.actions ?? []

              return (
                <TableRow key={resourceName} className="hover:bg-transparent">
                  <TableCell className="py-2">
                    <FieldLabel className="text-sm font-medium capitalize">{resourceName}</FieldLabel>
                  </TableCell>
                  <TableCell className="py-2 flex justify-end">
                    <Controller
                      name={`${formFieldName}.${resourceName}`}
                      control={form.control}
                      render={({ field, fieldState }) => {
                        const currentAction = field.value as PermissionAction | undefined
                        const selectedAction = currentAction ?? 'none'

                        return (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldContent className="items-end">
                              <ToggleGroup
                                type="single"
                                value={selectedAction}
                                onValueChange={(value) => {
                                  field.onChange((value || 'none') as PermissionAction)
                                }}
                                variant="outline"
                                aria-invalid={fieldState.invalid}
                              >
                                <ToggleGroupItem value="none" aria-label="None">
                                  None
                                </ToggleGroupItem>
                                {actions.includes('read') && (
                                  <ToggleGroupItem value="read" aria-label="Read">
                                    Read
                                  </ToggleGroupItem>
                                )}
                                {actions.includes('write') && (
                                  <ToggleGroupItem value="write" aria-label="Write">
                                    Write
                                  </ToggleGroupItem>
                                )}
                                {actions.includes('invoke') && (
                                  <ToggleGroupItem value="invoke" aria-label="Invoke">
                                    Invoke
                                  </ToggleGroupItem>
                                )}
                                {actions.includes('publish') && (
                                  <ToggleGroupItem value="publish" aria-label="Publish">
                                    Publish
                                  </ToggleGroupItem>
                                )}
                              </ToggleGroup>
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </FieldContent>
                          </Field>
                        )
                      }}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          {scope === 'account' ? (
            <p className="text-sm text-muted-foreground">
              This API token is tied to this account and can make requests against the account to
              securely access your models and apps. Keep this token secure and never share it
              publicly.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              This API token is tied to you and can make requests against the selected accounts.
              When you leave those accounts, it will have its corresponding permissions revoked.
              Keep this token secure and never share it publicly.
            </p>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
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

          {/* Permissions Section */}
          {scope === 'user' ? (
            <Tabs defaultValue="account" className="w-full">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="user">User</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="space-y-6 mt-4">
                {renderPermissions('account')}
                {/* Account Selection for Account Tab */}
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
                              field.onChange((value || 'all') as 'all' | 'specific')
                            }}
                            variant="outline"
                            aria-invalid={fieldState.invalid}
                          >
                            <ToggleGroupItem value="all" aria-label="All Accounts" className="flex-none">
                              All Accounts
                            </ToggleGroupItem>
                            <ToggleGroupItem value="specific" aria-label="Specific Accounts" className="flex-none">
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
                                        field.onChange(current.filter((id) => id !== account.id))
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
                {renderPermissions('user')}
              </TabsContent>
            </Tabs>
          ) : (
            // For account scope, only show account permissions
            renderPermissions('account')
          )}

          {/* Section 3: Enable Switch and TTL */}
          <Controller
            name="enabled"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="horizontal" className="items-center justify-between">
                <FieldContent>
                  <FieldLabel htmlFor={`${field.name}-switch`} className="text-base">
                    Enabled
                  </FieldLabel>
                  <FieldDescription>
                    Enable or disable this API token
                  </FieldDescription>
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

          <Controller
            name="dateRange"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${field.name}-button`}>Time to Live (TTL)</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={`${field.name}-button`}
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                      aria-invalid={fieldState.invalid}
                    >
                      {field.value?.from ? (
                        field.value.to ? (
                          <>
                            {format(field.value.from, 'LLL dd, y')} -{' '}
                            {format(field.value.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(field.value.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={field.value?.from}
                      selected={field.value as DateRange}
                      onSelect={field.onChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => router.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <CircleSpinner />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
