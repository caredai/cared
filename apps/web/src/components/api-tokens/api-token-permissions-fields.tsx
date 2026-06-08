import { Controller, type Control, type FieldValues } from 'react-hook-form'

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@cared/ui/components/field'
import { Table, TableBody, TableCell, TableRow } from '@cared/ui/components/table'
import { ToggleGroup, ToggleGroupItem } from '@cared/ui/components/toggle-group'

import type { PermissionAction } from './api-token-policy-form'

export function ApiTokenPermissionsFields<TFieldValues extends FieldValues>({
  control,
  permScope,
  permissions,
}: {
  control: Control<TFieldValues>
  permScope: 'account' | 'user'
  permissions: Record<string, { actions: string[] }>
}) {
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
                    name={`${formFieldName}.${resourceName}` as never}
                    control={control}
                    render={({ field, fieldState }) => {
                      const selectedActions = (field.value as PermissionAction[] | undefined) ?? []
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
