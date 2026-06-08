import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod/v4'

import { Button } from '@cared/ui/components/button'
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { useAccounts } from '@/hooks/use-account'
import { useActiveAccountId } from '@/hooks/use-active'
import { useCreateApiToken, useListPermissionGroups } from '@/hooks/use-api-token'
import { useSessionPublic } from '@/hooks/use-session'
import { AccountApiTokenScopeFields } from './account-api-token-scope-fields'
import { ApiTokenPermissionsFields } from './api-token-permissions-fields'
import {
  buildPoliciesFromFormValues,
  createEmptyPermissions,
  organizeAccountUserPermissions,
  organizePermissions,
} from './api-token-policy-form'
import { ApiTokenTtlFields } from './api-token-ttl-fields'
import { ttlPresetToExpiry } from './api-token-ttl'
import { useShowApiTokenDialog } from './show-api-token-dialog'

const permissionActionsSchema = z.array(
  z.enum(['read', 'write', 'invoke', 'publish']),
)

const ttlPresetSchema = z.enum(['none', '7d', '30d', '90d', '1y', 'custom'])

// Form schema for creating API token
const createApiTokenSchema = z
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

type CreateApiTokenFormValues = z.infer<typeof createApiTokenSchema>

export function CreateApiToken({
  credentialType,
}: {
  credentialType: 'account' | 'user'
}) {
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

  const organizedPermissions = useMemo(
    () => organizePermissions(permissionGroups),
    [permissionGroups],
  )

  const organizedAccountUserPermissions = useMemo(
    () => organizeAccountUserPermissions(permissionGroups),
    [permissionGroups],
  )

  const initializePermissions = useMemo(
    () => createEmptyPermissions(organizedPermissions),
    [organizedPermissions],
  )

  const form = useForm<CreateApiTokenFormValues>({
    resolver: zodResolver(createApiTokenSchema),
    defaultValues: {
      name: '',
      accountPermissions: initializePermissions.accountPermissions,
      userPermissions: initializePermissions.userPermissions,
      accountScope: credentialType === 'user' ? 'all' : undefined,
      accountIds: [],
      accountTokenScope: credentialType === 'account' ? 'entire' : undefined,
      memberUserId: undefined,
      enabled: true,
      ttlPreset: 'none',
      dateRange: undefined,
    },
  })

  const onSubmit = async (data: CreateApiTokenFormValues) => {
    try {
      setIsCreating(true)

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
        throw new Error('At least one permission must be selected')
      }

      const ttl = ttlPresetToExpiry(data.ttlPreset, data.dateRange)

      const result = await createApiToken({
        name: data.name,
        credentialType,
        policies,
        enabled: data.enabled,
        expiresAt: ttl?.expiresAt,
        notBefore: ttl?.notBefore,
      })

      showApiTokenDialog(result.token.token)
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

  return (
    <>
      <div className="space-y-6">
        <div>
          {credentialType === 'account' ? (
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
              organizedAccountUserPermissions={organizedAccountUserPermissions.accountUserPerms}
            />
          )}

          {/* Section 3: Enable Switch and TTL */}
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

          <ApiTokenTtlFields control={form.control} setValue={form.setValue} />

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
