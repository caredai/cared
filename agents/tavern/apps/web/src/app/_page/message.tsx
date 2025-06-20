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

const PurePreviewMessage = ({
  message,
  index,
  count,
  navigate,
}: {
  message: Message
  index: number
  count: number
  navigate: (previous: boolean) => void
}) => {
  const role = message.role
  const parts = message.content.parts
  const annotation = message.content.annotations[0]

  const activeCharOrGroup = useActiveCharacterOrGroup()
  const { activePersona } = useActivePersona()

  const [mode, setMode] = useState<'view' | 'edit'>('view')

  const operateActions = [
    {
      icon: faLanguage,
    },
    {
      icon: faPaintbrush,
    },
    {
      icon: faBullhorn,
    },
    {
      icon: faEye,
    },
    {
      icon: faPaperclip,
    },
    {
      icon: faFlagCheckered,
    },
    {
      icon: faCodeBranch,
    },
    {
      icon: faCopy,
    },
    {
      icon: faPencil,
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
      char = activeCharOrGroup.characters.find((c) => c.id === annotation.characterId)
      if (!annotation.characterId || !char) {
        return null
      }
    } else {
      char = activeCharOrGroup
    }
  } else if (role === 'user') {
    if (annotation.personaId !== activePersona.id) {
      if (!annotation.personaName) {
        return null
      }
      persona = {
        name: annotation.personaName,
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
        className="w-full flex gap-2"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      ></motion.div>

      {char ? (
        <CharacterAvatar src={char.metadata.url} alt={char.content.data.name} />
      ) : (
        persona && <CharacterAvatar src={persona.imageUrl ?? defaultPng} alt={persona.name} />
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="w-full md:w-auto flex justify-between items-center gap-2">
            <span>{char ? char.content.data.name : persona ? persona.name : ''}</span>
            <span className="text-xs">
              {format(new Date(message.createdAt), 'MMM dd, yyyy hh:mm a')}
            </span>
          </div>
          <div className="w-full md:w-auto flex justify-between items-center gap-2">
            {operateActions.map(({ icon }) => {
              return <FaButton icon={icon} btnSize="size-4" iconSize="lg" />
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {parts.map((part, index) => {
            const { type } = part
            const key = `message-${message.id}-part-${index}`

            if (type === 'text') {
              if (mode === 'view') {
                return (
                  <div key={key}>
                    <Markdown>{part.text}</Markdown>
                  </div>
                )
              }
            }
          })}
        </div>
      </div>
    </AnimatePresence>
  )
}

export const PreviewMessage = memo(PurePreviewMessage)
