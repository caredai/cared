import type { Control, FieldValues, Path, UseFormSetValue } from 'react-hook-form'
import { Controller, useWatch } from 'react-hook-form'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@cared/ui/components/field'
import { ToggleGroup, ToggleGroupItem } from '@cared/ui/components/toggle-group'

import type { AccountTokenScope } from './api-token-policy-form'
import { MemberSelect } from '@/components/member-select'
import { useMembers } from '@/hooks/use-members'
import { ApiTokenPermissionsFields } from './api-token-permissions-fields'
import { createEmptyAccountUserPermissions, createEmptyPermissions } from './api-token-policy-form'

export function AccountApiTokenScopeFields<TFieldValues extends FieldValues>({
  control,
  setValue,
  organizedAccountPermissions,
  organizedAccountUserPermissions,
}: {
  control: Control<TFieldValues>
  setValue: UseFormSetValue<TFieldValues>
  organizedAccountPermissions: Record<string, { actions: string[] }>
  organizedAccountUserPermissions: Record<string, { actions: string[] }>
}) {
  const { members } = useMembers()
  const accountTokenScope =
    (useWatch({ control, name: 'accountTokenScope' as never }) as unknown as
      | AccountTokenScope
      | undefined) ?? 'entire'
  const permissionsForScope =
    accountTokenScope === 'member' ? organizedAccountUserPermissions : organizedAccountPermissions

  const handleScopeChange = (scope: AccountTokenScope) => {
    setValue('accountTokenScope' as Path<TFieldValues>, scope as never, { shouldDirty: true })
    setValue(
      'accountPermissions' as Path<TFieldValues>,
      (scope === 'member'
        ? createEmptyAccountUserPermissions({ accountUserPerms: organizedAccountUserPermissions })
        : createEmptyPermissions({
            accountPerms: organizedAccountPermissions,
            userPerms: {},
          }).accountPermissions) as never,
      { shouldDirty: true },
    )
    if (scope === 'entire') {
      setValue('memberUserId' as Path<TFieldValues>, undefined as never, { shouldDirty: true })
    }
  }

  return (
    <div className="space-y-8">
      <Controller
        name={'accountTokenScope' as never}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-base font-semibold">Scope</FieldLabel>
            <FieldDescription>
              Choose whether this token applies to the entire account or a specific member.
            </FieldDescription>
            <FieldContent>
              <ToggleGroup
                type="single"
                value={field.value ?? 'entire'}
                onValueChange={(value) => {
                  if (!value) return
                  handleScopeChange(value as AccountTokenScope)
                }}
                variant="outline"
                aria-invalid={fieldState.invalid}
              >
                <ToggleGroupItem value="entire" aria-label="Entire Account" className="flex-none">
                  Entire Account
                </ToggleGroupItem>
                <ToggleGroupItem value="member" aria-label="Specified Member" className="flex-none">
                  Specified Member
                </ToggleGroupItem>
              </ToggleGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldContent>
          </Field>
        )}
      />

      {accountTokenScope === 'member' && (
        <Controller
          name={'memberUserId' as never}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="max-w-md">
              <FieldLabel>Member</FieldLabel>
              <FieldDescription>
                The token is restricted to this member via nested account user resources.
              </FieldDescription>
              <MemberSelect
                className="max-w-md"
                value={members.find((member) => member.user.id === field.value)?.id}
                onValueChange={(memberId) => {
                  const member = members.find((entry) => entry.id === memberId)
                  field.onChange(member?.user.id ?? '')
                }}
                placeholder="Select member..."
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}

      <ApiTokenPermissionsFields
        control={control}
        permScope="account"
        permissions={permissionsForScope}
      />
    </div>
  )
}
