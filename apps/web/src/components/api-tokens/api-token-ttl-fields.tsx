import type { DateRange } from 'react-day-picker';
import type { Control, FieldValues, Path, UseFormSetValue } from 'react-hook-form';
import { format } from 'date-fns';
import { Controller, useWatch } from 'react-hook-form';



import { Button } from '@cared/ui/components/button';
import { Calendar } from '@cared/ui/components/calendar';
import { Field, FieldContent, FieldError, FieldLabel } from '@cared/ui/components/field';
import { Popover, PopoverContent, PopoverTrigger } from '@cared/ui/components/popover';
import { ToggleGroup, ToggleGroupItem } from '@cared/ui/components/toggle-group';
import { cn } from '@cared/ui/lib/utils';



import type { TtlPreset } from './api-token-ttl';
import { TTL_PRESET_OPTIONS } from './api-token-ttl';


export function ApiTokenTtlFields<TFieldValues extends FieldValues>({
  control,
  setValue,
  wrapperClassName,
}: {
  control: Control<TFieldValues>
  setValue: UseFormSetValue<TFieldValues>
  wrapperClassName?: string
}) {
  const ttlPreset =
    (useWatch({ control, name: 'ttlPreset' as Path<TFieldValues> }) as TtlPreset | undefined) ??
    'none'

  const handlePresetChange = (preset: TtlPreset) => {
    setValue('ttlPreset' as Path<TFieldValues>, preset as never, { shouldDirty: true })
    if (preset !== 'custom') {
      setValue('dateRange' as Path<TFieldValues>, undefined as never, { shouldDirty: true })
    }
  }

  return (
    <Field className={wrapperClassName}>
      <FieldLabel>Time to Live (TTL)</FieldLabel>
      <FieldContent className="gap-4">
        <Controller
          name={'ttlPreset' as Path<TFieldValues>}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <ToggleGroup
                type="single"
                value={field.value ?? 'none'}
                onValueChange={(value) => {
                  if (!value) return
                  field.onChange(value)
                  handlePresetChange(value as TtlPreset)
                }}
                variant="outline"
                className="flex flex-wrap justify-start gap-2 rounded-none data-[variant=outline]:shadow-none"
                aria-invalid={fieldState.invalid}
              >
                {TTL_PRESET_OPTIONS.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    aria-label={option.label}
                    className="flex-none rounded-md px-3 data-[variant=outline]:border-l"
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {ttlPreset === 'custom' && (
          <Controller
            name={'dateRange' as Path<TFieldValues>}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full max-w-3xl justify-start text-left font-normal',
                        !field.value?.to && 'text-muted-foreground',
                      )}
                      aria-invalid={fieldState.invalid}
                    >
                      {field.value?.to ? (
                        field.value.from ? (
                          <>
                            {format(field.value.from, 'LLL dd, y')} -{' '}
                            {format(field.value.to, 'LLL dd, y')}
                          </>
                        ) : (
                          <>Expires {format(field.value.to, 'LLL dd, y')}</>
                        )
                      ) : (
                        <span>Pick expiration date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={field.value?.from ?? field.value?.to}
                      selected={field.value as DateRange}
                      onSelect={field.onChange}
                      numberOfMonths={2}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}
      </FieldContent>
    </Field>
  )
}
