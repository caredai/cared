import type { UseChatHelpers } from '@ai-sdk/react'
import type { MessageNode, UIMessage } from '@tavern/core'
import type { RefObject } from 'react'
import type { VListHandle } from 'virtua'
import { memo, useMemo } from 'react'
import { motion } from 'motion/react'
import { VList } from 'virtua'

import { PreviewMessage } from '@/app/_page/message'

function PureMessages({
  ref,
  endRef,
  chatId,
  messages,
  status,
  navigate,
}: {
  ref: RefObject<VListHandle | null>
  endRef: RefObject<HTMLDivElement | null>
  chatId?: string
  messages: MessageNode[]
  status: UseChatHelpers<UIMessage>['status']
  navigate: (current: MessageNode, previous: boolean) => void
}) {
  const indices = useMemo(() => {
    return messages.map((message) => {
      const index = message.parent.descendants.findIndex((m) => m === message)
      const count = message.parent.descendants.length
      return {
        index: index >= 0 ? index : 0,
        count,
      }
    })
  }, [messages])

  return (
    <VList ref={ref}>
      {messages.map((message, i) => (
        <PreviewMessage
          key={`${chatId ?? ''}-${i}`}
          message={message.message}
          isLoading={status === 'streaming' && messages.length - 1 === i}
          index={indices[i]!.index}
          count={indices[i]!.count}
          isRoot={!message.parent.message}
          navigate={(previous) => navigate(message, previous)}
        />
      ))}

      <motion.div ref={endRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
    </VList>
  )
}

export const Messages = memo(PureMessages)
