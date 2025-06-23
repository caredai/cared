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
        className="w-full flex gap-2 px-1.5 pt-2.5 pb-1"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {char ? (
          <CharacterAvatar src={char.metadata.url} alt={char.content.data.name} />
        ) : (
          persona && <CharacterAvatar src={persona.imageUrl ?? defaultPng} alt={persona.name} />
        )}

        <div className="flex flex-col gap-2">
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

          <div className="flex flex-col gap-2 w-full">
            {parts.map((part, index) => {
              const { type } = part
              const key = `message-${message.id}-part-${index}`

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key}>
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

function formatMessage(message: string) {
  return message.replace(
    /```[\s\S]*?```|``[\s\S]*?``|`[\s\S]*?`|(".*?")|(\u201C.*?\u201D)|(\u00AB.*?\u00BB)|(\u300C.*?\u300D)|(\u300E.*?\u300F)|(\uFF02.*?\uFF02)/gm,
    function (match, p1, p2, p3, p4, p5, p6) {
      if (p1) {
        // English double quotes
        return `<q>"${p1.slice(1, -1)}"</q>`;
      } else if (p2) {
        // Curly double quotes “ ”
        return `<q>“${p2.slice(1, -1)}”</q>`;
      } else if (p3) {
        // Guillemets « »
        return `<q>«${p3.slice(1, -1)}»</q>`;
      } else if (p4) {
        // Corner brackets 「 」
        return `<q>「${p4.slice(1, -1)}」</q>`;
      } else if (p5) {
        // White corner brackets 『 』
        return `<q>『${p5.slice(1, -1)}』</q>`;
      } else if (p6) {
        // Fullwidth quotes ＂ ＂
        return `<q>＂${p6.slice(1, -1)}＂</q>`;
      } else {
        // Return the original match if no quotes are found
        return match;
      }
    },
  )
}
