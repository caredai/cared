import { memo } from 'react'

import { Button } from '@mindworld/ui/components/button'

import { initialArtifactData, useArtifact } from '@/hooks/use-artifact'
import { CrossIcon } from './icons'

function PureArtifactCloseButton() {
  const { setArtifact } = useArtifact()

  return (
    <Button
      variant="outline"
      className="h-fit p-2 dark:hover:bg-zinc-700"
      onClick={() => {
        setArtifact((currentArtifact) =>
          currentArtifact.status === 'streaming'
            ? {
                ...currentArtifact,
                isVisible: false,
              }
            : { ...initialArtifactData, status: 'idle' },
        )
      }}
    >
      <CrossIcon size={18} />
    </Button>
  )
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true)
