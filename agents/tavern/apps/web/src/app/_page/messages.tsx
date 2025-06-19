import type { VListHandle } from 'virtua'
import { memo, useRef } from 'react'
import { VList } from 'virtua'

import { PreviewMessage } from '@/app/_page/message'
import { useActiveChat } from '@/hooks/use-chat'
import { useMessages } from '@/hooks/use-message'

function PureMessages() {
  const { activeChat } = useActiveChat()
  const { data } = useMessages(activeChat?.id)

  const ref = useRef<VListHandle>(null)

  return (
    <VList ref={ref} reverse>
      {data?.pages
        .flatMap((page) => page.messages)
        .map((message) => <PreviewMessage message={message} />)}
    </VList>
  )
}

export const Messages = memo(PureMessages)
