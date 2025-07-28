import type { Message } from '@tavern/core'
import { useState } from 'react'
import { format } from 'date-fns'
import { RotateCcw, Trash2 } from 'lucide-react'
import { Virtualizer } from 'virtua'

import { Button } from '@cared/ui/components/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@cared/ui/components/dialog'
import { cn } from '@cared/ui/lib/utils'

import { CircleSpinner } from '@/components/spinner'
import { useDeleteSummary, useSummaries } from '@/hooks/use-summary'

interface SummariesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SummariesDialog({ open, onOpenChange }: SummariesDialogProps) {
  const summaries = useSummaries()
  const deleteSummary = useDeleteSummary()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Reverse the summaries array to show newest first
  const reversedSummaries = [...summaries].reverse()

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteSummary(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleRestorePrevious = async () => {
    if (reversedSummaries.length > 0) {
      const firstSummary = reversedSummaries[0]!
      await handleDelete(firstSummary.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center gap-8">
          <DialogTitle>Summaries</DialogTitle>
          {reversedSummaries.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-1.5 has-[>svg]:px-1.5 text-xs"
              onClick={handleRestorePrevious}
              disabled={reversedSummaries.length < 2}
            >
              <RotateCcw className="h-4 w-4" />
              Restore Previous
            </Button>
          )}
        </DialogHeader>

        {reversedSummaries.length === 0 ? (
          <div className="flex-1 items-center justify-center text-muted-foreground text-center text-sm">
            No summaries available
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-y-auto px-[1px] [overflow-anchor:none]">
            <Virtualizer>
              {reversedSummaries.map((summary, index) => (
                <SummaryItem
                  key={summary.id}
                  summary={summary}
                  index={index}
                  total={reversedSummaries.length}
                  onDelete={handleDelete}
                  isDeleting={deletingId === summary.id}
                  isHighlighted={index === 0}
                />
              ))}
            </Virtualizer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface SummaryItemProps {
  summary: {
    id: string
    summary: string
    msg: Message
    msgIndex: number
  }
  index: number
  total: number
  onDelete: (id: string) => void
  isDeleting: boolean
  isHighlighted: boolean
}

function SummaryItem({
  summary,
  index,
  total,
  onDelete,
  isDeleting,
  isHighlighted,
}: SummaryItemProps) {
  const [showDelete, setShowDelete] = useState(false)

  const getMessageContent = (message: Message) => {
    return message.content.parts
      .map((part) => part.type === 'text' && part.text)
      .filter(Boolean)
      .join('\n')
  }

  const truncateContent = (content: string, maxLength = 400) => {
    if (content.length > maxLength) {
      return '...' + content.substring(content.length - maxLength)
    }
    return content
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col items-start my-1 border border-border rounded-lg p-3 text-left transition-colors cursor-pointer',
        'hover:bg-accent hover:text-accent-foreground',
        isHighlighted && 'bg-indigo-500/25 border-indigo-500/50',
      )}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">#{total - index}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(summary.msg.createdAt), 'MMM dd, yyyy hh:mm a')}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 opacity-0 transition-opacity',
            'hover:bg-destructive hover:text-destructive-foreground',
            showDelete && 'opacity-100',
          )}
          onClick={() => onDelete(summary.id)}
          disabled={isDeleting}
        >
          {isDeleting ? <CircleSpinner /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Summary content */}
      <p className="line-clamp-3 text-xs text-secondary-foreground mt-1">
        {truncateContent(summary.summary)}
      </p>

      {/* Message content */}
      <div className="flex gap-2 mt-1">
        <span>Msg #{summary.msgIndex + 1}</span>
        <p className="line-clamp-1 text-xs text-secondary-foreground">
          {truncateContent(getMessageContent(summary.msg))}
        </p>
      </div>
    </div>
  )
}
