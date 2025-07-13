import type { Character } from '@/hooks/use-character'
import type { Chat as AIChat, UseChatHelpers } from '@ai-sdk/react'
import type { Message, MessageContent, UIMessage } from '@tavern/core'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import type { ScrollToIndexAlign } from 'virtua'
import { memo, useEffect, useRef, useState } from 'react'
import {
  // faBullhorn,
  faChevronLeft,
  faChevronRight,
  faCodeBranch,
  faCopy,
  faEye,
  faEyeSlash,
  faGhost,
  // faLanguage,
  // faPaintbrush,
  // faPaperclip,
  faPencil,
  faRotate,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { format } from 'date-fns'
import { AnimatePresence, motion } from 'motion/react'
import hash from 'stable-hash'

import { CharacterAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import { isCharacterGroup, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useActivePersona } from '@/hooks/use-persona'
import { cn } from '@/lib/utils'
import defaultPng from '@/public/images/user-default.png'
import { CloneChatDialog } from './clone-chat-dialog'
import { DeleteMessageDialog } from './delete-message-dialog'
import { MessageReasoning } from './message-reasoning'
import { MessageText } from './message-text'

const MAX_SIBLING_COUNT = 8
const SLIDE_OFFSET = '50dvw'

const PurePreviewMessage = ({
  chatRef: _,
  message,
  status,
  isGenerating,
  index,
  siblingIndex,
  siblingCount,
  isRoot: __,
  isLast,
  navigate,
  refresh,
  swipe,
  edit,
  editMessageId,
  setEditMessageId,
  scrollTo,
  elapsedSeconds,
}: {
  chatRef: RefObject<AIChat<UIMessage>>
  message: Message
  status: UseChatHelpers<UIMessage>['status']
  isGenerating: boolean
  index: number
  siblingIndex: number
  siblingCount: number
  isRoot: boolean
  isLast: boolean
  navigate: (previous: boolean) => void
  refresh: () => void
  swipe: () => void
  edit: (content: MessageContent, regenerate: boolean) => Promise<void>
  editMessageId: string
  setEditMessageId: Dispatch<SetStateAction<string>>
  scrollTo: (
    index?: number,
    opts?: {
      align?: ScrollToIndexAlign
      smooth?: boolean
    },
  ) => void
  elapsedSeconds?: number
}) => {
  const role = message.role
  const parts = message.content.parts
  const metadata = message.content.metadata

  const activeCharOrGroup = useActiveCharacterOrGroup()
  const { activePersona } = useActivePersona()

  const mode = editMessageId === message.id ? 'edit' : 'view'
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const firstTextEditRef = useRef<HTMLTextAreaElement>(null)
  const firstTextEditIndex = parts.findIndex((part) => part.type === 'text')

  const handleCopyText = async () => {
    // Extract all text content from message parts
    const textContent = parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n\n')

    if (textContent) {
      await navigator.clipboard.writeText(textContent)
    }
  }

  const operateActions = [
    // {
    //   icon: faLanguage,
    //   tooltip: 'Translate message',
    // },
    // {
    //   icon: faPaintbrush,
    //   tooltip: 'Generate image',
    // },
    // {
    //   icon: faBullhorn,
    //   tooltip: 'Read aloud',
    // },
    {
      icon: !metadata.excluded ? faEye : faEyeSlash,
      tooltip: 'Exclude message from prompt',
      action: () =>
        edit(
          {
            parts,
            metadata: {
              ...metadata,
              excluded: !metadata.excluded,
            },
          },
          false,
        ),
    },
    // {
    //   icon: faPaperclip,
    //   tooltip: 'Embed file or image',
    // },
    {
      icon: faCodeBranch,
      tooltip: 'Clone chat over branch',
      wrapper: CloneChatDialog,
    },
    {
      icon: faCopy,
      tooltip: 'Copy text',
      action: handleCopyText,
    },
    {
      icon: faRotate,
      tooltip: 'Regenerate message',
      action: refresh,
      role: 'assistant',
    },
    {
      icon: faPencil,
      tooltip: 'Edit message',
      action: () => setEditMessageId(message.id),
    },
    {
      icon: faTrashCan,
      tooltip: 'Delete message',
      wrapper: DeleteMessageDialog,
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

  // Focus the first text edit when entering edit mode
  useEffect(() => {
    if (mode === 'edit') {
      // Use setTimeout to ensure the component is fully rendered
      setTimeout(() => {
        firstTextEditRef.current?.focus()
        setTimeout(() => {
          scrollTo(index, {
            align: 'nearest',
            smooth: false,
          })
        }, 3)
      }, 100)
    }
  }, [index, mode, scrollTo])

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isGenerating || !contentRef.current) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      scrollTo(isLast ? index + 1 : index, {
        align: isLast ? 'end' : 'nearest',
        smooth: false,
      })
    })
    resizeObserver.observe(contentRef.current)

    return () => resizeObserver.disconnect()
  }, [index, isLast, isGenerating, scrollTo])

  useEffect(() => {
    if (isLast && role === 'user' && (status === 'submitted' || status === 'streaming')) {
      scrollTo(index + 1, {
        align: 'end',
        smooth: false,
      })
    }
  }, [isLast, role, status, index, scrollTo])

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

  const slideOffset =
    slideDirection === 'left' ? '-' + SLIDE_OFFSET : slideDirection === 'right' ? SLIDE_OFFSET : 0
  const slideOpacity = slideDirection ? 0 : 1

  const noContent = !parts.some((part) => part.type === 'text' && part.text)
  const empty = !parts.some(
    (part) => (part.type === 'reasoning' || part.type === 'text') && part.text,
  )

  const isAssistantFirstMessage = !metadata.modelId && role === 'assistant'

  return (
    <AnimatePresence>
      <motion.div
        className="w-full flex gap-2 px-1.5 pt-2.5 pb-1 overflow-x-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex flex-col gap-0.5">
          {char ? (
            <CharacterAvatar src={char.metadata.url} alt={char.content.data.name} />
          ) : (
            persona && <CharacterAvatar src={persona.imageUrl ?? defaultPng} alt={persona.name} />
          )}

          <span className="text-xs text-ring text-center">#{index + 1}</span>
          {(isGenerating || typeof metadata.generationSeconds === 'number') && (
            <span className="text-xs text-ring text-center">
              {isGenerating ? (elapsedSeconds ?? 0) : metadata.generationSeconds}s
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="w-full md:w-auto flex justify-start md:justify-between items-center gap-1">
              <span>{char ? char.content.data.name : persona ? persona.name : ''}</span>
              {metadata.excluded && <FontAwesomeIcon icon={faGhost} size="1x" className="fa-fw" />}
              <span className="text-xs text-muted-foreground">
                {format(message.createdAt, 'MMM dd, yyyy hh:mm a')}
              </span>
            </div>
            <div className="w-full md:w-auto flex justify-end md:justify-between items-center gap-2">
              {operateActions.map(({ icon, tooltip, action, wrapper: Wrapper, role: roleWant }) => {
                if (roleWant && role !== roleWant) {
                  return
                }
                const btn = (
                  <FaButton
                    key={tooltip}
                    icon={icon}
                    title={tooltip}
                    btnSize="size-4"
                    iconSize="1x"
                    onClick={action}
                  />
                )
                return Wrapper ? <Wrapper key={tooltip} trigger={btn} message={message} /> : btn
              })}
            </div>
          </div>

          <div className="flex-1 flex">
            <AnimatePresence
              mode="wait"
              onExitComplete={() => {
                setTimeout(() => {
                  setSlideDirection(null)
                  scrollTo(isLast ? index + 1 : index, {
                    align: isLast ? 'end' : 'nearest',
                    smooth: false,
                  })
                }, 100)
              }}
            >
              <motion.div
                key={`${message.id}-${siblingIndex}`}
                className="flex-1"
                initial={{
                  x: slideOffset,
                  opacity: slideOpacity,
                }}
                animate={{
                  x: 0,
                  opacity: 1,
                }}
                exit={{
                  x: slideOffset,
                  opacity: slideOpacity,
                }}
                transition={{
                  duration: 0.1,
                  ease: 'easeInOut',
                }}
              >
                <div
                  ref={contentRef}
                  className="flex flex-col gap-2 w-full text-[rgb(220,220,210)]"
                >
                  {isGenerating && empty && (
                    <span className="inline-block bg-gradient-to-r from-primary-foreground via-muted-foreground to-accent-foreground bg-clip-text text-transparent animate-text">
                      . . .
                    </span>
                  )}
                  {parts.map((part, partIndex) => {
                    const { type } = part
                    const key = `message-${message.id}-part-${partIndex}`

                    if (type === 'reasoning') {
                      return (
                        <MessageReasoning
                          key={key}
                          isGenerating={!part.text && noContent}
                          reasoning={part.text}
                        />
                      )
                    }

                    if (type === 'text') {
                      return (
                        <MessageText
                          key={key}
                          ref={partIndex === firstTextEditIndex ? firstTextEditRef : undefined}
                          mode={mode}
                          text={part.text}
                          onTextChange={(text, isEnter) => {
                            const newParts = [
                              ...parts.slice(0, partIndex),
                              {
                                ...part,
                                text,
                              },
                              ...parts.slice(partIndex + 1),
                            ]

                            const regenerate =
                              (role === 'user' &&
                                isLast &&
                                isEnter &&
                                newParts.some((part) => part.type === 'text' && part.text)) ??
                              false

                            void edit(
                              {
                                parts: newParts,
                                metadata,
                              },
                              regenerate,
                            )

                            setEditMessageId('')
                          }}
                        />
                      )
                    }
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="relative w-15">
              <div className="absolute bottom-1 right-0 flex items-center">
                <FaButton
                  className={cn(siblingIndex === 0 && 'opacity-0')}
                  disabled={siblingIndex === 0}
                  icon={faChevronLeft}
                  title="Swipe left"
                  btnSize="size-4"
                  iconSize="1x"
                  onClick={() => handleNavigate(true)}
                />
                <span className={cn('text-xs text-ring', siblingCount === 1 && 'opacity-0')}>
                  {siblingIndex + 1}/{siblingCount}
                </span>
                <FaButton
                  className={cn(
                    siblingIndex === siblingCount - 1 &&
                      (isAssistantFirstMessage || siblingCount >= MAX_SIBLING_COUNT) &&
                      'opacity-0',
                  )}
                  disabled={
                    siblingIndex === siblingCount - 1 &&
                    (isAssistantFirstMessage || siblingCount >= MAX_SIBLING_COUNT)
                  }
                  icon={faChevronRight}
                  title="Swipe right"
                  btnSize="size-4"
                  iconSize="1x"
                  onClick={() => {
                    if (siblingIndex < siblingCount - 1) {
                      handleNavigate(false)
                    } else if (!isAssistantFirstMessage && siblingCount < MAX_SIBLING_COUNT) {
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

export const PreviewMessage = memo(PurePreviewMessage, (prevProps, nextProps) => {
  if (hash(prevProps.message) !== hash(nextProps.message)) return false
  if (prevProps.status !== nextProps.status) return false
  if (prevProps.isGenerating !== nextProps.isGenerating) return false
  if (prevProps.index !== nextProps.index) return false
  if (prevProps.siblingIndex !== nextProps.siblingIndex) return false
  if (prevProps.siblingCount !== nextProps.siblingCount) return false
  if (prevProps.isRoot !== nextProps.isRoot) return false
  if (prevProps.isLast !== nextProps.isLast) return false
  if (prevProps.editMessageId !== nextProps.editMessageId) return false
  if (prevProps.elapsedSeconds !== nextProps.elapsedSeconds) return false

  return true
})
