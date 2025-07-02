import type { MessageNode } from '@tavern/core'
import type { RefObject } from 'react'
import type { VListHandle } from 'virtua'
import { memo, useMemo } from 'react'
import { motion } from 'motion/react'
import { VList } from 'virtua'
import type { UseChatHelpers } from '@ai-sdk/react';

import { PreviewMessage } from '@/app/_page/message'

function PureMessages({
  ref,
  endRef,
  messages,
  status,
  navigate,
}: {
  ref: RefObject<VListHandle | null>
  endRef: RefObject<HTMLDivElement | null>
  messages: MessageNode[]
  status: UseChatHelpers['status'];
  navigate: (current: MessageNode, previous: boolean) => void
}) {
  const indices = useMemo(() => {
    return messages.map((message) => {
      const index = message.parent?.descendants.findIndex((m) => m === message) ?? 0
      const count = message.parent?.descendants.length ?? 0
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
          key={message.message.id}
          message={message.message}
          isLoading={status === 'streaming' && messages.length - 1 === i}
          index={indices[i]!.index}
          count={indices[i]!.count}
          navigate={(previous) => navigate(message, previous)}
        />
      ))}

      <motion.div ref={endRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
    </VList>
  )
}

export const Messages = memo(PureMessages)
