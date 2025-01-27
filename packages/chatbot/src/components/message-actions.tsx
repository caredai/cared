import type { Message } from 'ai'
import { memo } from 'react'
import equal from 'fast-deep-equal'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { useCopyToClipboard } from 'usehooks-ts'

import type { Vote } from '@mindworld/db/schema'
import { Button } from '@mindworld/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@mindworld/ui/components/tooltip'

import { getMessageIdFromAnnotations } from '@/lib/utils'
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons'

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
}: {
  chatId: string
  message: Message
  vote: Vote | undefined
  isLoading: boolean
}) {
  const { mutate } = useSWRConfig()
  const [_, copyToClipboard] = useCopyToClipboard()

  if (isLoading) return null
  if (message.role === 'user') return null
  if (message.toolInvocations && message.toolInvocations.length > 0) return null

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                await copyToClipboard(message.content)
                toast.success('Copied to clipboard!')
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              disabled={vote?.isUpvoted}
              variant="outline"
              onClick={() => {
                const messageId = getMessageIdFromAnnotations(message)

                const upvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId,
                    type: 'up',
                  }),
                })

                void toast.promise(upvote, {
                  loading: 'Upvoting Response...',
                  success: () => {
                    void mutate<Vote[]>(
                      `/api/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return []

                        const votesWithoutCurrent = currentVotes.filter(
                          (vote) => vote.messageId !== message.id,
                        )

                        return [
                          ...votesWithoutCurrent,
                          {
                            chatId,
                            messageId: message.id,
                            isUpvoted: true,
                          },
                        ]
                      },
                      { revalidate: false },
                    )

                    return 'Upvoted Response!'
                  },
                  error: 'Failed to upvote response.',
                })
              }}
            >
              <ThumbUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upvote Response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              variant="outline"
              disabled={vote && !vote.isUpvoted}
              onClick={() => {
                const messageId = getMessageIdFromAnnotations(message)

                const downvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId,
                    type: 'down',
                  }),
                })

                void toast.promise(downvote, {
                  loading: 'Downvoting Response...',
                  success: () => {
                    void mutate<Vote[]>(
                      `/api/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return []

                        const votesWithoutCurrent = currentVotes.filter(
                          (vote) => vote.messageId !== message.id,
                        )

                        return [
                          ...votesWithoutCurrent,
                          {
                            chatId,
                            messageId: message.id,
                            isUpvoted: false,
                          },
                        ]
                      },
                      { revalidate: false },
                    )

                    return 'Downvoted Response!'
                  },
                  error: 'Failed to downvote response.',
                })
              }}
            >
              <ThumbDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Downvote Response</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

export const MessageActions = memo(PureMessageActions, (prevProps, nextProps) => {
  if (!equal(prevProps.vote, nextProps.vote)) return false
  if (prevProps.isLoading !== nextProps.isLoading) return false

  return true
})
