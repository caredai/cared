import { Label } from '@cared/ui/components/label'
import { Switch } from '@cared/ui/components/switch'

import { PopoverTooltip } from '@/components/tooltip'

export type ConnectionType = 'user' | 'account'

interface ConnectionTypeSelectorProps {
  value: ConnectionType
  onChange: (value: ConnectionType) => void
}

/**
 * ConnectionTypeSelector component
 * Switch component for selecting between User and Account connection types
 * Default (off) = User, On = Account
 */
export function ConnectionTypeSelector({ value, onChange }: ConnectionTypeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id="connection-type-selector"
        checked={value === 'account'}
        onCheckedChange={(checked) => {
          onChange(checked ? 'account' : 'user')
        }}
      />
      <Label htmlFor="connection-type-selector" className="text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          Account
          <PopoverTooltip
            content={
              <div className="space-y-1">
                <p className="font-medium">Connection Type</p>
                <p className="text-xs">
                  <strong>User:</strong> Show personal connections tied to you
                </p>
                <p className="text-xs">
                  <strong>Account:</strong> Show connections tied to the account
                </p>
              </div>
            }
          />
        </div>
      </Label>
    </div>
  )
}
