'use client'

import type { ComponentPropsWithoutRef } from 'react'
import dynamic from 'next/dynamic'

import { cn } from '@cared/ui/lib/utils'

const ReactJson = dynamic(() => import('react-json-view'), {
  ssr: false,
})

export const JsonDisplay = ({
  data,
  className,
  ...props
}: { data: object } & ComponentPropsWithoutRef<'div'>) => {
  return (
    <div
      className={cn(
        'max-h-full w-full overflow-auto border rounded-sm border-border p-1 bg-black',
        className,
      )}
      {...props}
    >
      <ReactJson
        src={data}
        name={false}
        theme={'brewer'}
        iconStyle="triangle"
        collapsed={3}
        enableClipboard={false}
        displayDataTypes={false}
      />
    </div>
  )
}
