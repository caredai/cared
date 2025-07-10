import type { Chat as AIChat, UseChatHelpers } from '@ai-sdk/react'
import type { MessageContent, MessageNode, UIMessage } from '@tavern/core'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import type { ScrollToIndexAlign, VListHandle } from 'virtua'
import { memo, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
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
  refresh,
  swipe,
  edit,
  editMessageId,
  setEditMessageId,
  scrollTo,
  generatingMessageId,
  elapsedSeconds,
}: {
  ref: RefObject<VListHandle | null>
  endRef: RefObject<HTMLDivElement | null>
  chatRef: RefObject<AIChat<UIMessage>>
  chatId?: string
  messages: MessageNode[]
  status: UseChatHelpers<UIMessage>['status']
  navigate: (current: string, previous: boolean) => void
  refresh: (current: MessageNode) => void
  swipe: (current: MessageNode) => void
  edit: (current: MessageNode, content: MessageContent, regenerate: boolean) => Promise<void>
  editMessageId: string
  setEditMessageId: Dispatch<SetStateAction<string>>
  scrollTo: (
    index?: number,
    opts?: {
      align?: ScrollToIndexAlign
      smooth?: boolean
    },
  ) => void
  generatingMessageId?: string
  elapsedSeconds: number
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
    <AnimatePresence mode="wait">
      <motion.div
        key={chatId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        onAnimationStart={() =>
          scrollTo(undefined, {
            smooth: false,
          })
        }
        className="w-full h-full"
      >
        <VList ref={ref} count={messages.length + 1} className="scrollbar-stable">
          {(i) => {
            const message = messages[i]
            const key = `${chatId ?? ''}-${i}`

            const isGenerating =
              (status === 'submitted' || status === 'streaming') &&
              !!generatingMessageId &&
              generatingMessageId === message?.message.id

            if (message) {
              return (
                <PreviewMessage
                  key={key}
                  chatRef={chatRef}
                  message={message.message}
                  status={status}
                  isGenerating={isGenerating}
                  index={i}
                  siblingIndex={indices[i]!.index}
                  siblingCount={indices[i]!.count}
                  isRoot={!message.parent.message}
                  isLast={!message.descendants.length}
                  navigate={(previous) => navigate(message.message.id, previous)}
                  refresh={() => refresh(message)}
                  swipe={() => swipe(message)}
                  edit={(content, regenerate) => edit(message, content, regenerate)}
                  editMessageId={editMessageId}
                  setEditMessageId={setEditMessageId}
                  scrollTo={scrollTo}
                  elapsedSeconds={isGenerating ? elapsedSeconds : undefined}
                />
              )
            } else {
              return (
                <motion.div key={key} ref={endRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
              )
            }
          }}
        </VList>
      </motion.div>
    </AnimatePresence>
  )
}

export const Messages = memo(PureMessages)
