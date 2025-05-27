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
        <FormItem className={cn('flex flex-row items-start space-x-3 space-y-0', className)}>
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="bg-muted" />
          </FormControl>
          <div className="flex flex-col gap-1 leading-none">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
        </FormItem>
      )}
    />
  )
}
