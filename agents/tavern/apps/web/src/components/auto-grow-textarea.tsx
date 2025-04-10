import type { ComponentProps } from 'react'
import * as React from 'react'

import { Textarea } from '@ownxai/ui/components/textarea'
import { cn } from '@ownxai/ui/lib/utils'

export function AutoGrowTextarea({
  className,
  onInput,
  value, // Need value to trigger effect on external changes
  extraHeight = 0,
  ref,
  ...props
}: ComponentProps<typeof Textarea> & {
  extraHeight?: number
}) {
  const internalRef = React.useRef<HTMLTextAreaElement>(null)
  // Use the forwarded ref if available, otherwise use the internal ref
  const textareaRef = (ref ?? internalRef) as React.RefObject<HTMLTextAreaElement | null>

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // 1. Temporarily reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // 2. Calculate the new height
      const newHeight = textarea.scrollHeight + extraHeight
      // 3. Set the new height (CSS max-height will limit it)
      textarea.style.height = `${newHeight}px`
    }
  }, [textareaRef, extraHeight])

  // Adjust height on initial mount and when the value changes
  React.useEffect(() => {
    // Timeout ensures that the DOM is fully rendered and styles applied
    const timer = setTimeout(adjustHeight, 0)
    return () => clearTimeout(timer)
    // Rerun when the value changes externally or adjustHeight changes (ref change)
  }, [value, adjustHeight])

  const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    adjustHeight()
    // Call the original onInput handler if it was provided
    if (onInput) {
      onInput(event)
    }
  }

  return (
    <Textarea
      ref={textareaRef}
      className={cn(
        // Add resize-none to prevent manual resizing
        'resize-none overflow-y-auto',
        className,
      )}
      rows={1} // Give browser initial hint for ~1 row height
      onInput={handleInput} // Use onInput for immediate feedback
      value={value} // Ensure component is controlled externally if needed
      {...props}
    />
  )
}
