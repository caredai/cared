import { memo } from 'react'

import { Button } from '@mindworld/ui/components/button'

import { initialBlockData, useBlock } from '@/hooks/use-block'
import { CrossIcon } from './icons'

function PureBlockCloseButton() {
  const { setBlock } = useBlock()

  return (
    <Button
      variant="outline"
      className="h-fit p-2 dark:hover:bg-zinc-700"
      onClick={() => {
        setBlock((currentBlock) =>
          currentBlock.status === 'streaming'
            ? {
                ...currentBlock,
                isVisible: false,
              }
            : { ...initialBlockData, status: 'idle' },
        )
      }}
    >
      <CrossIcon size={18} />
    </Button>
  )
}

export const BlockCloseButton = memo(PureBlockCloseButton, () => true)
