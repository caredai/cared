'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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

import { useTRPC } from '@/trpc/client'

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Workspace name cannot be empty',
  }),
})

type FormValues = z.infer<typeof formSchema>

interface CreateWorkspaceDialogProps {
  menu?: (props: { trigger: (props: { children: ReactNode }) => ReactNode }) => ReactNode
  trigger?: ReactNode
  onSuccess?: () => void
}

export function CreateWorkspaceDialog({ menu, trigger, onSuccess }: CreateWorkspaceDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const trpc = useTRPC()

  // Get the mutation function
  const createWorkspaceMutation = useMutation(trpc.workspace.create.mutationOptions())

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  })

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      // Call TRPC API to create workspace
      await createWorkspaceMutation.mutateAsync({
        name: values.name,
      })

      // Close dialog and reset form
      setOpen(false)
      form.reset()

      // Show success message
      toast.success('Workspace created successfully')

      // Refresh route or call success callback
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error) {
      // Show error message
      toast.error('Failed to create workspace')
      console.error('Failed to create workspace:', error)
    }
  }

  const Menu = menu

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {Menu && (
        <Menu trigger={({ children }) => <DialogTrigger asChild>{children}</DialogTrigger>} />
      )}
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your projects and team members.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter workspace name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
