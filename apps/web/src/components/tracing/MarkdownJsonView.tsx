import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { languageModelV2MessageSchema } from '@cared/api/types'
import { Button } from '@cared/ui/components/button'

import type { LanguageModelV2Message } from '@ai-sdk/provider'
import { StringOrMarkdownSchema } from '@/lib/MarkdownSchema'
import { MarkdownView } from './MarkdownView'
import { PrettyJsonView } from './PrettyJsonView'

export function MarkdownJsonViewHeader({
  title,
  handleOnCopy,
  canEnableMarkdown: _canEnableMarkdown = true,
  controlButtons,
}: {
  title: string
  handleOnCopy: (event?: React.MouseEvent<HTMLButtonElement>) => void
  canEnableMarkdown?: boolean
  controlButtons?: React.ReactNode
}) {
  const [isCopied, setIsCopied] = useState(false)

  return (
    <div className="flex flex-row items-center justify-between px-1 py-1 text-sm font-medium capitalize">
      {title}
      <div className="mr-1 flex min-w-0 flex-shrink flex-row items-center gap-1">
        {controlButtons}
        <Button
          title="Copy to clipboard"
          variant="ghost"
          size="icon"
          type="button"
          onClick={(event) => {
            setIsCopied(true)
            handleOnCopy(event)
            setTimeout(() => setIsCopied(false), 1000)
          }}
          className="-mr-2 hover:bg-border w-6 h-6"
        >
          {isCopied ? <Check className="h-3! w-3!" /> : <Copy className="h-3! w-3!" />}
        </Button>
      </div>
    </div>
  )
}

export function MarkdownJsonView({
  message,
  content,
  title,
  className,
  customCodeHeaderClassName,
}: {
  message?: LanguageModelV2Message
  content?: unknown
  title?: string
  className?: string
  customCodeHeaderClassName?: string
}) {
  const stringOrValidatedMarkdown = useMemo(
    () => StringOrMarkdownSchema.safeParse(content ?? message?.content),
    [content, message],
  )
  const validatedMessage = useMemo(() => languageModelV2MessageSchema.safeParse(message), [message])

  return (
    <>
      {stringOrValidatedMarkdown.success || validatedMessage.success ? (
        <MarkdownView
          markdown={stringOrValidatedMarkdown.data ?? validatedMessage.data?.content ?? ''}
          title={title ?? message?.role}
          customCodeHeaderClassName={customCodeHeaderClassName}
        />
      ) : (
        <PrettyJsonView json={content} title={title} className={className} currentView="pretty" />
      )}
    </>
  )
}
