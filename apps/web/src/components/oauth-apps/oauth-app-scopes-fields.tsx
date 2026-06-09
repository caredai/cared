import { useEffect } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { z } from 'zod/v4'

import { Checkbox } from '@cared/ui/components/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@cared/ui/components/field'
import { Table, TableBody, TableCell, TableRow } from '@cared/ui/components/table'
import { ToggleGroup, ToggleGroupItem } from '@cared/ui/components/toggle-group'
import { cn } from '@cared/ui/lib/utils'

export type PermissionAction = 'read' | 'write' | 'invoke' | 'publish'

const permissionActionSchema = z.enum(['read', 'write', 'invoke', 'publish'])

/** Coerce legacy single-action string values into the array format used by the form. */
export function normalizeApiScopeActions(value: unknown): PermissionAction[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is PermissionAction =>
        typeof item === 'string' &&
        item !== 'none' &&
        permissionActionSchema.safeParse(item).success,
    )
  }

  if (typeof value === 'string') {
    if (value === 'none') {
      return []
    }

    const parsed = permissionActionSchema.safeParse(value)
    return parsed.success ? [parsed.data] : []
  }

  return []
}

export const OAUTH_STANDARD_SCOPE_OPTIONS = [
  {
    id: 'openid',
    name: 'OpenID',
    description: 'Required for OpenID Connect authentication',
  },
  {
    id: 'profile',
    name: 'Profile',
    description: 'Access basic profile information',
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Access the user email address',
  },
  {
    id: 'offline_access',
    name: 'Offline Access',
    description: 'Issue refresh tokens for long-lived access',
  },
] as const

export const oauthAppScopesFormSchema = z.object({
  standardScopes: z.object({
    openid: z.boolean(),
    profile: z.boolean(),
    email: z.boolean(),
    offline_access: z.boolean(),
  }),
  apiScopes: z.record(z.string(), z.array(permissionActionSchema)),
})

export type OAuthAppScopesFormValues = z.infer<typeof oauthAppScopesFormSchema>

export function organizeApiScopes(scopes: { id: string; name: string }[]) {
  const perms: Record<string, { actions: string[]; scopeIds: Record<string, string> }> = {}

  for (const scope of scopes) {
    const [resource, action] = scope.id.split(':')
    if (!resource || !action) {
      continue
    }

    perms[resource] ??= { actions: [], scopeIds: {} }
    if (!perms[resource].actions.includes(action)) {
      perms[resource].actions.push(action)
    }
    perms[resource].scopeIds[action] = scope.id
  }

  return perms
}

export function buildDefaultApiScopes(organizedApiScopes: ReturnType<typeof organizeApiScopes>) {
  const apiScopes: Record<string, PermissionAction[]> = {}
  for (const resource of Object.keys(organizedApiScopes)) {
    apiScopes[resource] = []
  }
  return apiScopes
}

export function syncApiScopesFormValues(
  apiScopes: Record<string, unknown> | undefined,
  organizedApiScopes: ReturnType<typeof organizeApiScopes>,
) {
  const defaults = buildDefaultApiScopes(organizedApiScopes)
  return Object.fromEntries(
    Object.keys(organizedApiScopes).map((resource) => [
      resource,
      normalizeApiScopeActions(apiScopes?.[resource] ?? defaults[resource]),
    ]),
  )
}

export function parseScopesToFormValues(
  scopes: string[],
  organizedApiScopes: ReturnType<typeof organizeApiScopes>,
): OAuthAppScopesFormValues {
  const standardScopes = {
    openid: scopes.includes('openid'),
    profile: scopes.includes('profile'),
    email: scopes.includes('email'),
    offline_access: scopes.includes('offline_access'),
  }

  const apiScopes = buildDefaultApiScopes(organizedApiScopes)
  for (const [resource, resourceScopes] of Object.entries(organizedApiScopes)) {
    const selectedActions: PermissionAction[] = []
    for (const action of resourceScopes.actions) {
      const scopeId = resourceScopes.scopeIds[action]
      if (scopeId && scopes.includes(scopeId)) {
        selectedActions.push(action as PermissionAction)
      }
    }
    apiScopes[resource] = selectedActions
  }

  return { standardScopes, apiScopes }
}

export function buildSelectedScopes(
  data: OAuthAppScopesFormValues,
  organizedApiScopes: ReturnType<typeof organizeApiScopes>,
) {
  const selectedScopes: string[] = []

  for (const option of OAUTH_STANDARD_SCOPE_OPTIONS) {
    if (data.standardScopes[option.id]) {
      selectedScopes.push(option.id)
    }
  }

  for (const [resource, actions] of Object.entries(data.apiScopes)) {
    for (const action of actions) {
      const scopeId = organizedApiScopes[resource]?.scopeIds[action]
      if (scopeId) {
        selectedScopes.push(scopeId)
      }
    }
  }

  return selectedScopes
}

interface OAuthAppScopesFieldsProps<T extends FieldValues> {
  control: Control<T>
  organizedApiScopes: ReturnType<typeof organizeApiScopes>
  idPrefix?: string
}

function ApiScopeActionsToggleField({
  field,
  fieldState,
  actions,
}: {
  field: {
    value: unknown
    onChange: (value: PermissionAction[]) => void
  }
  fieldState: { invalid: boolean; error?: { message?: string } }
  actions: string[]
}) {
  useEffect(() => {
    if (typeof field.value === 'string' || field.value === undefined) {
      field.onChange(normalizeApiScopeActions(field.value))
    }
  }, [field])

  const selectedActions = normalizeApiScopeActions(field.value)
  const isNone = selectedActions.length === 0
  const displayValue = isNone ? ['none'] : selectedActions

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldContent className="items-end">
        <ToggleGroup
          key={isNone ? 'none' : 'actions'}
          type="multiple"
          value={displayValue}
          onValueChange={(newValues) => {
            const actionValues = newValues.filter(
              (value): value is PermissionAction => value !== 'none',
            )

            if (newValues.includes('none') && !isNone) {
              field.onChange([])
              return
            }

            if (actionValues.length === 0) {
              field.onChange([])
              return
            }

            field.onChange(actionValues)
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
}

export function OAuthAppScopesFields<T extends OAuthAppScopesFormValues & FieldValues>({
  control,
  organizedApiScopes,
  idPrefix = '',
}: OAuthAppScopesFieldsProps<T>) {
  return (
    <>
      <div className="space-y-4">
        <div>
          <FieldLabel className="text-base font-semibold">Standard Scopes</FieldLabel>
          <FieldDescription>
            OpenID Connect scopes for identity, profile, and refresh tokens.
          </FieldDescription>
        </div>
        <div className="space-y-3">
          {OAUTH_STANDARD_SCOPE_OPTIONS.map((option) => (
            <Controller
              key={option.id}
              name={`standardScopes.${option.id}` as Path<T>}
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="horizontal" className="items-start gap-3">
                  <Checkbox
                    id={`${idPrefix}standard-scope-${option.id}`}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldContent>
                    <FieldLabel
                      htmlFor={`${idPrefix}standard-scope-${option.id}`}
                      className="font-medium"
                    >
                      {option.name}
                    </FieldLabel>
                    <FieldDescription>{option.description}</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <FieldLabel className="text-base font-semibold">Permission Scopes</FieldLabel>
          <FieldDescription>
            API capabilities this OAuth App may request during user authorization.
          </FieldDescription>
        </div>
        <Table>
          <TableBody>
            {Object.keys(organizedApiScopes).map((resourceName) => {
              const resourceScopes = organizedApiScopes[resourceName]
              const actions = resourceScopes?.actions ?? []

              return (
                <TableRow key={resourceName} className="hover:bg-transparent">
                  <TableCell className="py-2">
                    <FieldLabel
                      className={cn(
                        'text-sm font-medium',
                        ['mcp'].includes(resourceName) ? 'uppercase' : 'capitalize',
                      )}
                    >
                      {resourceName}
                    </FieldLabel>
                  </TableCell>
                  <TableCell className="py-2 flex justify-end">
                    <Controller
                      name={`apiScopes.${resourceName}` as Path<T>}
                      control={control}
                      render={({ field, fieldState }) => (
                        <ApiScopeActionsToggleField
                          field={field}
                          fieldState={fieldState}
                          actions={actions}
                        />
                      )}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
