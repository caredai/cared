import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

import { AutoGrowTextarea } from '@/components/auto-grow-textarea'

export function MessageTextEdit({
  text,
  onTextChange,
  ref,
}: {
  text: string
  onTextChange: (text: string) => void
  ref?: RefObject<HTMLTextAreaElement | null>
}) {
  const [input, setInput] = useState('')
  useEffect(() => {
    setInput(text)
  }, [text])

  return (
    <AutoGrowTextarea
      ref={ref}
      className="min-h-[36px] max-h-[50dvh] text-white resize-y"
      extraHeight={2}
      value={input}
      onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
      onBlur={() => {
        onTextChange(input.trim())
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
          event.preventDefault()
          onTextChange(input.trim())
        }
      }}
    />
  )
}
