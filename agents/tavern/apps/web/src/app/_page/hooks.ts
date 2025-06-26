import type { UseChatHelpers } from '@ai-sdk/react'
import { useEffect, useState } from 'react'

type Status = UseChatHelpers['status']

export function useCallWhenGenerating(
  chatId: string | undefined,
  status: Status,
  func: (status: Status) => void,
) {
  const [lastStatus, setLastStatus] = useState<Status>()
  useEffect(() => {
    setLastStatus(undefined)
  }, [chatId])

  useEffect(() => {
    if (status !== lastStatus || status === 'submitted' || status === 'streaming') {
      setLastStatus(status)
      func(status)
    }
  }, [status, lastStatus, func])
}
