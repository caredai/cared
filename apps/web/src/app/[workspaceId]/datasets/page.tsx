'use client'

import * as React from 'react'

import { Select, SelectTrigger, SelectValue } from '@mindworld/ui/components/select'

import { VirtualizedSelectContent } from '@/components/virtualized-select-content'

const items = Array.from({ length: 10000 }, (_, index) => ({
  label: `Item ${index + 1}`,
  value: index % 10 ? index.toString() : undefined,
}))

export default function Page() {
  const [value, setValue] = React.useState('')
  const [open, setOpen] = React.useState(false)

  return (
    <div>
      <Select open={open} onOpenChange={setOpen} value={value} onValueChange={setValue}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select an item" />
        </SelectTrigger>
        <VirtualizedSelectContent items={items} value={value} open={open} />
      </Select>
    </div>
  )
}
