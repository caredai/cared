'use client'

import type { Attachment, Message } from 'ai'
import { useState } from 'react'
import { useChat } from 'ai/react'
import { toast } from 'sonner'
import useSWR, { useSWRConfig } from 'swr'

import type { MessageVote } from '@mindworld/db/schema'

import type { VisibilityType } from './visibility-selector'
import { ChatHeader } from '@/components/chat-header'
import { useArtifactSelector } from '@/hooks/use-artifact'
import { fetcher, generateUUID } from '@/lib/utils'
import { Artifact } from './artifact'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'

export function Chat({
  id,
  initialMessages,
  modelId,
  setModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string
  initialMessages: Message[]
  modelId: string
  setModelId: (modelId: string) => void
  selectedVisibilityType: VisibilityType
  isReadonly: boolean
}) {
  const { mutate } = useSWRConfig()

  const { messages, setMessages, handleSubmit, input, setInput, append, isLoading, stop, reload } =
    useChat({
      id,
      body: { id, selectedChatModel: modelId },
      initialMessages,
      experimental_throttle: 100,
      sendExtraMessageFields: true,
      generateId: generateUUID,
      onFinish: () => {
        void mutate('/api/history')
      },
      onError: (_error) => {
        toast.error('An error occured, please try again!')
      },
    })

  const { data: votes } = useSWR<MessageVote[]>(`/api/vote?chatId=${id}`, fetcher)

  const [attachments, setAttachments] = useState<Attachment[]>([])
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible)

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          modelId={modelId}
          setModelId={setModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  )
}
