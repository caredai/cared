import type { Character } from '@/hooks/use-character'
import type { Chat as AIChat } from '@ai-sdk/react'
import type { Message, MessageContent, UIMessage } from '@tavern/core'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { memo, useState } from 'react'
import {
  faBullhorn,
  faChevronLeft,
  faChevronRight,
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

import { MessageTextEdit } from '@/app/_page/message-edit'
import { CharacterAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import { Markdown } from '@/components/markdown'
import { isCharacterGroup, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useActivePersona } from '@/hooks/use-persona'
import defaultPng from '@/public/images/user-default.png'
import { MessageReasoning } from './message-reasoning'
import { formatMessage } from './utils'

const PurePreviewMessage = ({
  chatRef,
  message,
  isLoading,
  index,
  count,
  isRoot,
  navigate,
  swipe,
  edit,
  editMessageId,
  setEditMessageId,
}: {
  chatRef: RefObject<AIChat<UIMessage>>
  message: Message
  isLoading: boolean
  index: number
  count: number
  isRoot: boolean
  navigate: (previous: boolean) => void
  swipe: () => void
  edit: (content: MessageContent) => void
  editMessageId: string
  setEditMessageId: Dispatch<SetStateAction<string>>
}) => {
  const role = message.role
  const parts = message.content.parts
  const metadata = message.content.metadata

  const activeCharOrGroup = useActiveCharacterOrGroup()
  const { activePersona } = useActivePersona()

  const mode = editMessageId === message.id ? 'edit' : 'view'
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)

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
      action: () => setEditMessageId(message.id),
    },
  ]

  const handleNavigate = (previous: boolean) => {
    setSlideDirection(previous ? 'left' : 'right')
    navigate(previous)
  }

  const handleSwipe = () => {
    setSlideDirection('right')
    swipe()
  }

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
        className="w-full flex gap-2 px-1.5 pt-2.5 pb-1 overflow-x-hidden"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div>
          {char ? (
            <CharacterAvatar src={char.metadata.url} alt={char.content.data.name} />
          ) : (
            persona && <CharacterAvatar src={persona.imageUrl ?? defaultPng} alt={persona.name} />
          )}
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="w-full md:w-auto flex justify-start md:justify-between items-center gap-2">
              <span>{char ? char.content.data.name : persona ? persona.name : ''}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(message.createdAt), 'MMM dd, yyyy hh:mm a')}
              </span>
            </div>
            <div className="w-full md:w-auto flex justify-end md:justify-between items-center gap-2">
              {operateActions.map(({ icon, tooltip, action }) => {
                return (
                  <FaButton
                    key={tooltip}
                    icon={icon}
                    title={tooltip}
                    btnSize="size-4"
                    iconSize="1x"
                    onClick={action}
                  />
                )
              })}
            </div>
          </div>

          <div className="flex-1 flex">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${message.id}-${index}`}
                className="flex-1"
                initial={{
                  x: slideDirection === 'left' ? -100 : slideDirection === 'right' ? 100 : 0,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  opacity: 1,
                }}
                exit={{
                  x: slideDirection === 'left' ? -100 : slideDirection === 'right' ? 100 : 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.1,
                  ease: 'easeInOut',
                }}
                onAnimationComplete={() => {
                  // setSlideDirection(null)
                }}
              >
                <div className="flex flex-col gap-2 w-full text-[rgb(220,220,210)]">
                  {parts.map((part, partIndex) => {
                    const { type } = part
                    const key = `message-${message.id}-part-${partIndex}`

                    if (type === 'reasoning') {
                      return (
                        <MessageReasoning key={key} isLoading={isLoading} reasoning={part.text} />
                      )
                    }

                    if (type === 'text') {
                      if (mode === 'view') {
                        return (
                          <div key={key} className="flex flex-col gap-2">
                            <Markdown>{formatMessage(part.text)}</Markdown>
                          </div>
                        )
                      } else {
                        return (
                          <MessageTextEdit
                            key={key}
                            text={part.text}
                            onTextChange={(text) => {
                              edit({
                                parts: [
                                  ...parts.slice(0, partIndex),
                                  {
                                    ...part,
                                    text,
                                  },
                                  ...parts.slice(partIndex + 1),
                                ],
                                metadata,
                              })

                              setEditMessageId('')
                            }}
                          />
                        )
                      }
                    }
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="relative w-15">
              <div className="absolute bottom-1 right-0 flex items-center">
                <FaButton
                  icon={faChevronLeft}
                  title="Swipe left"
                  btnSize="size-4"
                  iconSize="1x"
                  disabled={index === 0}
                  onClick={() => handleNavigate(true)}
                />
                <span className="text-xs text-ring">
                  {index + 1}/{count}
                </span>
                <FaButton
                  icon={faChevronRight}
                  title="Swipe right"
                  btnSize="size-4"
                  iconSize="1x"
                  disabled={index === count - 1 && isRoot && role !== 'user'}
                  onClick={() => {
                    if (index < count - 1) {
                      handleNavigate(false)
                    } else if (!isRoot || role === 'user') {
                      handleSwipe()
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export const PreviewMessage = memo(PurePreviewMessage)
