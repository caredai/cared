'use client'

import * as React from 'react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { composeRefs } from '@radix-ui/react-compose-refs'

import { cn } from '@ownxai/ui/lib/utils'

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
      if (isOpenState && contentRef.current) {
        setHeight(contentRef.current.scrollHeight)
      } else {
        setHeight(0)
      }
    }

    handleStateChange()

    const observer = new MutationObserver(handleStateChange)
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-state'],
    })

    return () => {
      observer.disconnect()
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
    }
  })

  console.log('props', props)

  return (
    <CollapsiblePrimitive.CollapsibleContent
      ref={composeRefs(localRef, ref)}
      forceMount
      className={cn('overflow-hidden transition-all duration-300', className)}
      style={{
        maxHeight: isOpen ? `${height}px` : '0px',
        opacity: isOpen ? 1 : 0,
      }}
      data-slot="collapsible-content"
      {...props}
    >
      {childrenWithRef}
    </CollapsiblePrimitive.CollapsibleContent>
  )
}
