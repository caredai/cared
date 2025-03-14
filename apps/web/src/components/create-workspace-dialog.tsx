'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { CreateWorkspaceSchema } from '@mindworld/db/schema'
import { Button } from '@mindworld/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mindworld/ui/components/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@mindworld/ui/components/form'
import { Input } from '@mindworld/ui/components/input'
import { log } from '@mindworld/utils'

import { CircleSpinner } from '@/components/spinner'
import { useWorkspace } from '@/hooks/use-workspace'
import { useTRPC } from '@/trpc/client'

interface CreateWorkspaceDialogProps {
  menu?: (props: { trigger: (props: { children: ReactNode }) => ReactNode }) => ReactNode
  trigger?: ReactNode
  onSuccess?: () => void
}

export function CreateWorkspaceDialog({ menu, trigger, onSuccess }: CreateWorkspaceDialogProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [, setWorkspace] = useWorkspace()

  const form = useForm({
    resolver: zodResolver(CreateWorkspaceSchema),
    defaultValues: {
      name: '',
    },
  })

  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  const createWorkspace = useMutation(
    trpc.workspace.create.mutationOptions({
      onSuccess: async (workspace) => {
        setOpen(false)

        toast.success('Workspace created successfully')

        setWorkspace({
          ...workspace.workspace,
          role: workspace.role,
        })
        // optimistic update
        queryClient.setQueryData(
          trpc.workspace.get.queryOptions({
            id: workspace.workspace.id,
          }).queryKey,
          workspace,
        )

        await queryClient.invalidateQueries(trpc.workspace.queryFilter())

        // Refresh route or call success callback
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/apps')
        }
      },
      onError: (error) => {
        log.error('Failed to create workspace:', error)
        toast.error(
          error.data?.code === 'UNAUTHORIZED'
            ? 'You must be logged in to create workspace'
            : 'Failed to create workspace',
        )
      },
    }),
  )

  const Menu = menu

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (form.formState.isSubmitting && !newOpen) {
          return
        }
        setOpen(newOpen)
      }}
    >
      {Menu && (
        <Menu trigger={({ children }) => <DialogTrigger asChild>{children}</DialogTrigger>} />
      )}
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your applications and agents, and collaborate with
            team members.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              return createWorkspace.mutateAsync(data)
            })}
            className="grid gap-8 mt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter workspace name"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <CircleSpinner />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
