'use client'

import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import { cn } from '@ownxai/ui/lib/utils'

import { Markdown } from '@/components/markdown'
import { Spinner } from '@/components/spinner'

interface MessageReasoningProps {
  isGenerating: boolean
  reasoning: string
}

export function MessageReasoning({ isGenerating, reasoning }: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '0.5rem',
      marginBottom: '0.5rem',
    },
  }

  return (
    <div className="flex flex-col text-zinc-400 text-sm">
      {isGenerating ? (
        <div className="flex gap-2 items-center">
          <div className="font-medium">Reasoning</div>
          <Spinner />
        </div>
      ) : (
        <button
          type="button"
          className="cursor-pointer"
          onClick={() => {
            setIsExpanded(!isExpanded)
          }}
        >
          <div className="flex gap-2 items-center">
            <div className="font-medium">Reasoned for a few seconds</div>
            <ChevronDownIcon
              className={cn('size-3 transition-transform duration-200', isExpanded && 'rotate-180')}
            />
          </div>
        </button>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="p-4 text-zinc-400 border rounded-lg flex flex-col gap-2"
          >
            <Markdown>{reasoning}</Markdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
