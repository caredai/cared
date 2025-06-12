import type { ChatItem } from '@/hooks/use-chat'
import { useCallback, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Plus } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { Virtualizer } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import { cn } from '@ownxai/ui/lib/utils'

import { CircleSpinner } from '@/components/spinner'
import { useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useChatsByCharacterOrGroup, useCreateChat, useSetActiveChat } from '@/hooks/use-chat'

export function ChatListView() {
  const activeCharOrGroup = useActiveCharacterOrGroup()
  const setActiveChat = useSetActiveChat()
  const { data, isLoading, isSuccess, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useChatsByCharacterOrGroup(activeCharOrGroup?.id)
  const createChat = useCreateChat()

  const handleCreateChat = useCallback(async () => {
    if (!activeCharOrGroup) return
    const chat = await createChat(activeCharOrGroup.id)
    if (chat) {
      setActiveChat(chat.id)
    }
  }, [activeCharOrGroup, createChat, setActiveChat])

  const handleChatClick = useCallback(
    (chatId: string) => {
      setActiveChat(chatId)
    },
    [setActiveChat],
  )

  const { ref, inView } = useInView()

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    if (inView) {
      handleLoadMore()
    }
  }, [inView, handleLoadMore])

  if (!activeCharOrGroup) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a character or group to view chat history
      </div>
    )
  }

  const chats = data?.pages.flatMap((page) => page.chats as ChatItem[]) ?? []

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-[1px] [overflow-anchor:none]">
      <div className="h-8 mb-2 sticky top-0 flex items-center justify-between bg-background z-1">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <Button variant="outline" className="text-xs" onClick={handleCreateChat} size="sm">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Virtualizer startMargin={40}>
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <CircleSpinner />
          </div>
        )}

        {isSuccess && chats.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No chats yet
          </div>
        )}

        {isSuccess && chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => handleChatClick(chat.id)}
            className={cn(
              'flex w-full flex-col items-start rounded-lg p-3 text-left transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="font-medium">{chat.metadata.title || 'Untitled Chat'}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
              </span>
            </div>
            {chat.lastMessage && (
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {chat.lastMessage.content.parts[0]?.type === 'text'
                  ? chat.lastMessage.content.parts[0].text
                  : ''}
              </p>
            )}
          </button>
        ))}

        {hasNextPage && (
          <Button
            ref={ref}
            variant="ghost"
            className="w-full"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? <CircleSpinner /> : null}
            Load More
          </Button>
        )}
      </Virtualizer>
    </div>
  )
}
