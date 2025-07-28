'use client'

import * as React from 'react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { composeRefs } from '@radix-ui/react-compose-refs'

import { cn } from '@cared/ui/lib/utils'

// https://github.com/radix-ui/primitives/discussions/1481#discussioncomment-11392540
export function CollapsibleContent({
  className,
  children,
  ref,
  ...props
}: Omit<React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>, 'children'> & {
  children: React.ReactElement<any>
}) {
  const contentRef = React.useRef<HTMLElement>(null)
  const [height, setHeight] = React.useState<number>(0)
  const [isOpen, setIsOpen] = React.useState(false)

  const localRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = localRef.current
    if (!element) return

    const handleStateChange = () => {
      const isOpenState = element.getAttribute('data-state') === 'open'
      setIsOpen(isOpenState)
      if (contentRef.current) {
        setHeight(contentRef.current.offsetHeight)
      }
    }

    handleStateChange()

    const resizeObserver = new ResizeObserver(handleStateChange)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    const mutationObserver = new MutationObserver(handleStateChange)
    mutationObserver.observe(element, {
      attributes: true,
      attributeFilter: ['data-state'],
    })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  const childrenWithRef = React.cloneElement(children, {
    ...children.props,
    ref: (node: HTMLElement | null) => {
      contentRef.current = node
      // Forward the ref if it exists
      const childrenRef = (children as any).ref
      if (typeof childrenRef === 'function') {
        childrenRef(node)
      }
    },
  })

  return (
    <CollapsiblePrimitive.CollapsibleContent
      ref={composeRefs(localRef, ref)}
      forceMount
      className={cn('overflow-hidden', className)}
      style={{
        maxHeight: `${height}px`,
        height: `${isOpen ? height : 0}px`,
        // @ts-ignore
        '--radix-collapsible-content-height': `${height}px`,
      }}
      data-slot="collapsible-content"
      {...props}
    >
      {childrenWithRef}
    </CollapsiblePrimitive.CollapsibleContent>
  )
}
