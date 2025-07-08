import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

import { AutoGrowTextarea } from '@/components/auto-grow-textarea'
import { Markdown } from '@/components/markdown'
import { formatMessage } from './utils'

export function MessageText({
  mode,
  text,
  onTextChange,
  ref,
}: {
  mode: 'view' | 'edit'
  text: string
  onTextChange: (text: string, isEnter?: boolean) => void
  ref?: RefObject<HTMLTextAreaElement | null>
}) {
  const [input, setInput] = useState('')
  useEffect(() => {
    setInput(text)
  }, [text])

  if (mode === 'view') {
    return (
      <div className="flex flex-col gap-2">
        <Markdown>{formatMessage(input)}</Markdown>
      </div>
    )
  }

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
          onTextChange(input.trim(), true)
        }
      }}
    />
  )
}
