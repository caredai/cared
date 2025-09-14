'use client'

import { ComponentProps } from 'react'
import { AlertTriangle, BadgeCheck, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@cared/ui/components/button'

import { ActionButton } from './ActionButton'

export const showSuccessToast = ({
  duration = 5000,
  ...params
}: Omit<ComponentProps<typeof SuccessNotification>, 'onDismiss'> & {
  duration?: number
}) => {
  toast.custom((t) => <SuccessNotification {...params} onDismiss={() => toast.dismiss(t)} />, {
    duration,
    style: {
      padding: '1rem',
      border: '1px solid hsl(var(--green-600))',
      borderRadius: '0.5rem',
      backgroundColor: 'hsl(var(--green-600))',
    },
  })
}

const SuccessNotification: React.FC<{
  title: string
  description: string
  onDismiss: () => void
  link?: {
    href: string
    text: string
  }
}> = ({ title, description, onDismiss, link }) => {
  return (
    <div className="flex justify-between">
      <div className="flex min-w-[300px] flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <BadgeCheck size={20} className="text-primary-foreground" />
          <div className="m-0 text-sm font-medium leading-tight text-primary-foreground">
            {title}
          </div>
        </div>
        {description && (
          <div className="text-sm leading-tight text-primary-foreground">{description}</div>
        )}
        {link && (
          <ActionButton href={link.href} size="sm" variant="secondary" className="self-start">
            {link.text}
          </ActionButton>
        )}
      </div>
      <button
        className="flex h-6 w-6 cursor-pointer items-start justify-end border-none bg-transparent p-0 text-primary-foreground transition-colors duration-200"
        onClick={onDismiss}
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export const showErrorToast = (
  error: string,
  description: string,
  type: 'WARNING' | 'ERROR' = 'ERROR',
  path?: string,
) => {
  toast.custom(
    (t) => (
      <ErrorNotification
        error={error}
        description={description}
        type={type}
        path={path}
        dismissToast={toast.dismiss}
        toast={t}
      />
    ),
    {
      duration: Infinity,
      style: {
        padding: '1rem',
        borderRadius: '0.5rem',
        ...(type === 'ERROR' ? toastErrorStyleProps : toastWarningStyleProps),
      },
    },
  )
}

const toastErrorStyleProps = {
  border: '1px solid hsl(var(--destructive))',
  backgroundColor: 'hsl(var(--destructive))',
}

const toastWarningStyleProps = {
  border: '1px solid hsl(var(--yellow-50))',
  backgroundColor: 'hsl(var(--yellow-50))',
}

export const ErrorNotification: React.FC<{
  error: string
  description: string
  type: 'WARNING' | 'ERROR'
  dismissToast: (t?: string | number) => void
  toast: string | number
  path?: string
}> = ({ error, description, type, dismissToast, toast, path }) => {
  const isError = type === 'ERROR'
  const textColor = isError ? 'text-destructive-foreground' : 'text-yellow-600'

  return (
    <div className="flex justify-between">
      <div className="flex min-w-[300px] flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className={textColor} />
          <div className={`m-0 text-sm font-medium leading-tight ${textColor}`}>{error}</div>
        </div>
        {description && (
          <div className={`whitespace-pre-line text-sm leading-tight ${textColor}`}>
            {description}
          </div>
        )}
        {path && <div className={`text-sm leading-tight ${textColor}`}>Path: {path}</div>}

        {isError && (
          <Button
            size="sm"
            className="bg-destructive-foreground/90 text-destructive hover:bg-destructive-foreground/80"
            onClick={() => {
              // TODO
            }}
          >
            Report issue to Cared team
          </Button>
        )}
      </div>
      <button
        className={`flex h-6 w-6 cursor-pointer items-start justify-end border-none bg-transparent p-0 ${textColor} transition-colors duration-200`}
        onClick={() => dismissToast(toast)}
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  )
}
