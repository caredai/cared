import type { Chat as AIChat, UseChatHelpers } from '@ai-sdk/react'
import type { MessageContent, MessageNode, UIMessage } from '@tavern/core'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import type { VListHandle } from 'virtua'
import { memo, useMemo } from 'react'
import { motion } from 'motion/react'
import { VList } from 'virtua'

import { PreviewMessage } from '@/app/_page/message'

function PureMessages({
  ref,
  endRef,
  chatRef,
  chatId,
  messages,
  status,
  navigate,
  swipe,
  edit,
  editMessageId,
  setEditMessageId,
  scrollTo,
}: {
  ref: RefObject<VListHandle | null>
  endRef: RefObject<HTMLDivElement | null>
  chatRef: RefObject<AIChat<UIMessage>>
  chatId?: string
  messages: MessageNode[]
  status: UseChatHelpers<UIMessage>['status']
  navigate: (current: MessageNode, previous: boolean) => void
  swipe: (current: MessageNode) => void
  edit: (current: MessageNode, content: MessageContent) => void
  editMessageId: string
  setEditMessageId: Dispatch<SetStateAction<string>>
  scrollTo: (index?: number | 'bottom') => void
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
          chatRef={chatRef}
          message={message.message}
          isLoading={status === 'streaming' && messages.length - 1 === i}
          index={i}
          siblingIndex={indices[i]!.index}
          siblingCount={indices[i]!.count}
          isRoot={!message.parent.message}
          navigate={(previous) => navigate(message, previous)}
          swipe={() => swipe(message)}
          edit={(content) => edit(message, content)}
          editMessageId={editMessageId}
          setEditMessageId={setEditMessageId}
          scrollTo={scrollTo}
        />
      ))}

      <motion.div ref={endRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
    </VList>
  )
}

export const Messages = memo(PureMessages)
