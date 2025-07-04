import type { Character } from '@/hooks/use-character'
import type { Message } from '@tavern/core'
import { memo, useState } from 'react'
import {
  faBullhorn,
  faCodeBranch,
  faCopy,
  faEye,
  faFlagCheckered,
  faLanguage,
  faPaintbrush,
  faPaperclip,
  faPencil,
} from '@fortawesome/free-solid-svg-icons'
import { format } from 'date-fns'
import { AnimatePresence, motion } from 'motion/react'

import { CharacterAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import { Markdown } from '@/components/markdown'
import { isCharacterGroup, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useActivePersona } from '@/hooks/use-persona'
import defaultPng from '@/public/images/user-default.png'
import { MessageReasoning } from './message-reasoning'
import { formatMessage } from './utils'

const PurePreviewMessage = ({
  message,
  isLoading,
  index,
  count,
  navigate,
}: {
  message: Message
  isLoading: boolean
  index: number
  count: number
  navigate: (previous: boolean) => void
}) => {
  const role = message.role
  const parts = message.content.parts
  const metadata = message.content.metadata

  const activeCharOrGroup = useActiveCharacterOrGroup()
  const { activePersona } = useActivePersona()

  const [mode, setMode] = useState<'view' | 'edit'>('view')

  const operateActions = [
    {
      icon: faLanguage,
      tooltip: 'Translate message',
    },
    {
      icon: faPaintbrush,
      tooltip: 'Generate image',
    },
    {
      icon: faBullhorn,
      tooltip: 'Narrate',
    },
    {
      icon: faEye,
      tooltip: 'Exclude message from prompt',
    },
    {
      icon: faPaperclip,
      tooltip: 'Embed file or image',
    },
    {
      icon: faFlagCheckered,
      tooltip: 'Create checkpoint',
    },
    {
      icon: faCodeBranch,
      tooltip: 'Create branch',
    },
    {
      icon: faCopy,
      tooltip: 'Copy message',
    },
    {
      icon: faPencil,
      tooltip: 'Edit',
    },
  ]

  if (!activeCharOrGroup || !activePersona) {
    return null
  }

  let char: Character | undefined
  let persona:
    | {
        name: string
        imageUrl?: string
      }
    | undefined

  if (role === 'assistant') {
    if (isCharacterGroup(activeCharOrGroup)) {
      char = activeCharOrGroup.characters.find((c) => c.id === metadata.characterId)
      if (!metadata.characterId || !char) {
        return null
      }
    } else {
      char = activeCharOrGroup
    }
  } else if (role === 'user') {
    if (metadata.personaId !== activePersona.id) {
      if (!metadata.personaName) {
        return null
      }
      persona = {
        name: metadata.personaName,
      }
    } else {
      persona = {
        name: activePersona.name,
        imageUrl: activePersona.metadata.imageUrl,
      }
    }
  } else {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        className="w-full flex gap-2 px-1.5 pt-2.5 pb-1"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {char ? (
          <CharacterAvatar src={char.metadata.url} alt={char.content.data.name} />
        ) : (
          persona && <CharacterAvatar src={persona.imageUrl ?? defaultPng} alt={persona.name} />
        )}

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="w-full md:w-auto flex justify-between items-center gap-2">
              <span>{char ? char.content.data.name : persona ? persona.name : ''}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(message.createdAt), 'MMM dd, yyyy hh:mm a')}
              </span>
            </div>
            <div className="w-full md:w-auto flex justify-between items-center gap-2">
              {operateActions.map(({ icon, tooltip }) => {
                return (
                  <FaButton
                    key={tooltip}
                    icon={icon}
                    title={tooltip}
                    btnSize="size-4"
                    iconSize="1x"
                  />
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full text-[rgb(220,220,210)]">
            {parts.map((part, index) => {
              const { type } = part
              const key = `message-${message.id}-part-${index}`

              if (type === 'reasoning') {
                return <MessageReasoning key={key} isLoading={isLoading} reasoning={part.text} />
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-col gap-2">
                      <Markdown>{formatMessage(part.text)}</Markdown>
                    </div>
                  )
                }
              }
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export const PreviewMessage = memo(PurePreviewMessage)
