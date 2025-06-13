import type { Chat } from '@/hooks/use-chat'
import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { useSwipeable } from 'react-swipeable'
import { Virtualizer } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import { cn } from '@ownxai/ui/lib/utils'

import { CircleSpinner } from '@/components/spinner'
import { useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useChatsByCharacterOrGroup, useCreateChat, useSetActiveChat } from '@/hooks/use-chat'
import { DeleteChatDialog } from './delete-chat-dialog'

export function ChatListView() {
  const activeCharOrGroup = useActiveCharacterOrGroup()
  const setActiveChat = useSetActiveChat()
  const { data, isLoading, isSuccess, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useChatsByCharacterOrGroup(activeCharOrGroup?.id)
  const createChat = useCreateChat()
  const [isCreating, setIsCreating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<Chat>()

  useEffect(() => {
    if (!deleteDialogOpen) {
      setChatToDelete(undefined)
    }
  }, [deleteDialogOpen])

  const handleCreateChat = useCallback(async () => {
    if (!activeCharOrGroup || isCreating) return
    try {
      setIsCreating(true)
      const chat = await createChat(activeCharOrGroup.id)
      if (chat) {
        setActiveChat(chat.id)
      }
    } finally {
      setIsCreating(false)
    }
  }, [activeCharOrGroup, createChat, setActiveChat, isCreating])

  const handleChatClick = useCallback(
    (chatId: string) => {
      setActiveChat(chatId)
    },
    [setActiveChat],
  )

  const handleDeleteClick = useCallback((chat: Chat) => {
    setChatToDelete(chat)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (chatToDelete === activeCharOrGroup?.id) {
      setActiveChat(undefined)
    }
  }, [chatToDelete, activeCharOrGroup?.id, setActiveChat])

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

  const chats = data?.pages.flatMap((page) => page.chats as Chat[]) ?? []

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-[1px] [overflow-anchor:none]">
      <div className="h-8 pb-2 sticky top-0 flex items-center justify-between bg-background z-1">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <Button
          variant="outline"
          className="h-6 has-[>svg]:px-1.5 text-xs"
          onClick={handleCreateChat}
          size="sm"
          disabled={isCreating}
        >
          {isCreating ? <CircleSpinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          New Chat
        </Button>
      </div>

      <Virtualizer startMargin={40}>
        {isLoading && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <CircleSpinner />
          </div>
        )}

        {isSuccess && chats.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No chats yet
          </div>
        )}

        {isSuccess &&
          chats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              onClick={() => handleChatClick(chat.id)}
              onDeleteClick={handleDeleteClick}
            />
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

      {chatToDelete && (
        <DeleteChatDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          chat={chatToDelete}
          onDelete={handleDeleteConfirm}
        />
      )}
    </div>
  )
}

function ChatItem({
  chat,
  onClick,
  onDeleteClick,
}: {
  chat: Chat
  onClick: () => void
  onDeleteClick: (chat: Chat) => void
}) {
  const [showDelete, setShowDelete] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)

  // Handle swipe gestures for mobile
  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      // Only allow left swipe
      if (e.dir === 'Left') {
        setSwipeOffset(Math.min(e.deltaX, 80))
      }
    },
    onSwipedLeft: () => {
      console.log(swipeOffset)
      if (swipeOffset > 40) {
        onDeleteClick(chat)
      }
      setSwipeOffset(0)
    },
    onSwipedRight: () => {
      setSwipeOffset(0)
    },
    trackMouse: true,
  })

  let lastMsg =
    chat.lastMessage?.content.parts[0]?.type === 'text'
      ? chat.lastMessage.content.parts[0].text
      : ''
  const len = 400
  lastMsg = lastMsg.length > len ? '...' + lastMsg.substring(lastMsg.length - len) : lastMsg

  return (
    <div
      {...swipeHandlers}
      className="relative"
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : undefined,
      }}
    >
      <button
        onClick={onClick}
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
        className={cn(
          'flex w-full flex-col items-start my-1 border border-border rounded-lg p-3 text-left transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <div className="flex w-full items-center justify-between text-muted-foreground">
          <span className="text-sm font-medium">{chat.metadata.title || 'Untitled Chat'}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs">
              {format(new Date(chat.updatedAt), 'MMM dd, yyyy hh:mm a')}
            </span>
            {/* Desktop delete button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6 opacity-0 transition-opacity',
                'hover:bg-destructive hover:text-destructive-foreground',
                showDelete && 'opacity-100',
                'md:inline-flex hidden',
              )}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteClick(chat)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {lastMsg && (
          <p className="mt-1 line-clamp-3 text-sm text-secondary-foreground">{lastMsg}</p>
        )}
      </button>
      {/* Mobile delete button (shown when swiped) */}
      <div
        className={cn(
          'absolute right-0 top-0 h-full flex items-center px-4 bg-destructive text-destructive-foreground',
          'md:hidden',
          swipeOffset > 0 ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          width: '80px',
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : undefined,
        }}
      >
        <Trash2 className="h-5 w-5" />
      </div>
    </div>
  )
}
