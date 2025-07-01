import { Checkbox } from '@ownxai/ui/components/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@ownxai/ui/components/form'
import { cn } from '@ownxai/ui/lib/utils'

export function CheckboxField({
  label,
  name,
  control,
  description,
  className,
}: {
  label: string
  name: string
  control: any
  description?: string
  className?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex flex-row items-start space-x-2 space-y-0', className)}>
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="bg-muted" />
          </FormControl>
          <div className="flex flex-col gap-1 leading-none">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
        </FormItem>
      )}
    />
  )
}

export function CheckboxGroupField<T extends string | number>({
  label,
  name,
  control,
  options,
  description,
  className,
}: {
  label: string
  name: string
  control: any
  options: { value: T; label: string }[]
  description?: string
  className?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('space-y-1', className)}>
          <FormLabel className="text-xs">{label}</FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <div className="space-y-1">
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${name}-${option.value}`}
                    checked={field.value.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValues = field.value
                      if (checked) {
                        field.onChange([...currentValues, option.value])
                      } else {
                        field.onChange(currentValues.filter((v: T) => v !== option.value))
                      }
                    }}
                    className="bg-muted"
                  />
                  <label htmlFor={`${name}-${option.value}`} className="text-sm">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  )
}
