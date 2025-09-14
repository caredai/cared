import { cva } from 'class-variance-authority'
import {
  Bot,
  CircleDot,
  ClipboardPen,
  Clock,
  Database,
  Fan,
  FileText,
  FlaskConical,
  Layers3,
  Link,
  ListTodo,
  ListTree,
  MoveHorizontal,
  Search,
  ShieldCheck,
  TestTubeDiagonal,
  User,
  WandSparkles,
  Wrench,
} from 'lucide-react'

import { Badge } from '@cared/ui/components/badge'
import { cn } from '@cared/ui/lib/utils'

import type { ObservationType } from '@langfuse/core'

export type LangfuseItemType =
  | ObservationType
  | 'TRACE'
  | 'SESSION'
  | 'USER'
  | 'QUEUE_ITEM'
  | 'DATASET'
  | 'DATASET_RUN'
  | 'DATASET_ITEM'
  | 'ANNOTATION_QUEUE'
  | 'PROMPT'
  | 'EVALUATOR'
  | 'RUNNING_EVALUATOR'

const iconMap = {
  TRACE: ListTree,
  GENERATION: Fan,
  EVENT: CircleDot,
  SPAN: MoveHorizontal,
  AGENT: Bot,
  TOOL: Wrench,
  CHAIN: Link,
  RETRIEVER: Search,
  EMBEDDING: Layers3,
  GUARDRAIL: ShieldCheck,
  SESSION: Clock,
  USER: User,
  QUEUE_ITEM: ClipboardPen,
  DATASET: Database,
  DATASET_RUN: FlaskConical,
  DATASET_ITEM: TestTubeDiagonal,
  ANNOTATION_QUEUE: ListTodo,
  PROMPT: FileText,
  RUNNING_EVALUATOR: Bot,
  EVALUATOR: WandSparkles,
} as const

const iconVariants = cva(cn('h-4 w-4'), {
  variants: {
    type: {
      TRACE: 'text-green-700',
      GENERATION: 'text-purple-500',
      EVENT: 'text-green-500',
      SPAN: 'text-blue-500',
      AGENT: 'text-purple-600',
      TOOL: 'text-orange-600',
      CHAIN: 'text-pink-600',
      RETRIEVER: 'text-teal-600',
      EMBEDDING: 'text-amber-600',
      GUARDRAIL: 'text-red-600',
      SESSION: 'text-blue-600',
      USER: 'text-blue-600',
      QUEUE_ITEM: 'text-blue-600',
      DATASET: 'text-blue-600',
      DATASET_RUN: 'text-blue-600',
      DATASET_ITEM: 'text-blue-600',
      ANNOTATION_QUEUE: 'text-blue-600',
      PROMPT: 'text-blue-600',
      EVALUATOR: 'text-indigo-600',
      RUNNING_EVALUATOR: 'text-blue-600',
    },
  },
})

export function ItemBadge({
  type,
  showLabel = false,
  isSmall = false,
  className,
}: {
  type: LangfuseItemType
  showLabel?: boolean
  isSmall?: boolean
  className?: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const Icon = iconMap[type] || ListTree // Default to ListTree if unknown type

  // Modify this line to ensure the icon is properly sized
  const iconClass = cn(iconVariants({ type }), isSmall ? 'h-3 w-3' : 'h-4 w-4', className)

  const label = String(type).charAt(0).toUpperCase() + String(type).slice(1).toLowerCase()

  return (
    <Badge
      variant="outline"
      title={label}
      className={cn(
        'flex max-w-fit items-center gap-1 overflow-hidden whitespace-nowrap border-2 bg-background px-1 rounded-sm',
        isSmall && 'h-4',
      )}
    >
      <Icon className={iconClass} />
      {showLabel && (
        <span className="truncate" title={label.replace(/_/g, ' ')}>
          {label.replace(/_/g, ' ')}
        </span>
      )}
    </Badge>
  )
}
