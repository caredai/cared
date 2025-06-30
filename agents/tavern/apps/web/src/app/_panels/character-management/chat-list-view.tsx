import type { Chat } from '@/hooks/use-chat'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { Virtualizer } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@ownxai/ui/components/context-menu'
import { cn } from '@ownxai/ui/lib/utils'

import { CircleSpinner } from '@/components/spinner'
import { useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useActiveChatId, useChatsByCharacterOrGroup, useCreateChat } from '@/hooks/use-chat'
import { DeleteChatDialog } from './delete-chat-dialog'

export function ChatListView() {
  const activeCharOrGroup = useActiveCharacterOrGroup()
  const { data, isLoading, isSuccess, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useChatsByCharacterOrGroup(activeCharOrGroup?.id)
  const chats = useMemo(() => data?.pages.flatMap((page) => page.chats) ?? [], [data])
  const { activeChatId, setActiveChat } = useActiveChatId()

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
      const chat = (await createChat(activeCharOrGroup.id))?.chat
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
              isActive={activeChatId === chat.id}
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
  isActive,
  onClick,
  onDeleteClick,
}: {
  chat: Chat
  isActive?: boolean
  onClick: () => void
  onDeleteClick: (chat: Chat) => void
}) {
  const [showDelete, setShowDelete] = useState(false)

  let lastMsg =
    chat.lastMessage?.content.parts.map(part => part.type === 'text' && part.text).filter(Boolean).join('\n') ?? ''
  const len = 400
  lastMsg = lastMsg.length > len ? '...' + lastMsg.substring(lastMsg.length - len) : lastMsg

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={onClick}
          onMouseEnter={() => setShowDelete(true)}
          onMouseLeave={() => setShowDelete(false)}
          className={cn(
            'flex w-full flex-col items-start my-1 border border-border rounded-lg p-3 text-left transition-colors cursor-pointer',
            'hover:bg-accent hover:text-accent-foreground',
            isActive && 'bg-indigo-500/25 hover:bg-indigo-500/25',
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
            <p className="mt-1 line-clamp-3 text-xs text-secondary-foreground">{lastMsg}</p>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="z-6000">
        <ContextMenuItem
          className="focus:bg-ring pl-2"
          onClick={() => {
            onDeleteClick(chat)
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete Chat
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
