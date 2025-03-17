'use client'

import type { Workspace } from '@/hooks/use-workspace'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Trash2, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { UpdateWorkspaceSchema } from '@mindworld/db/schema'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@mindworld/ui/components/alert-dialog'
import { Button } from '@mindworld/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mindworld/ui/components/card'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@mindworld/ui/components/form'
import { Input } from '@mindworld/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mindworld/ui/components/select'

import { CircleSpinner } from '@/components/spinner'
import { useTRPC } from '@/trpc/client'

/**
 * General settings component for workspace
 * Allows updating workspace name, transferring ownership, and deleting workspace
 */
export function General({ workspace }: { workspace: Workspace }) {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const isOwner = workspace.role === 'owner'

  // Form for updating workspace name
  const form = useForm({
    resolver: zodResolver(UpdateWorkspaceSchema.omit({ id: true })),
    defaultValues: {
      name: workspace.name,
    },
  })

  // Update workspace mutation
  const updateWorkspaceMutation = useMutation(
    trpc.workspace.update.mutationOptions({
      onSuccess: (data) => {
        form.reset({ name: data.workspace.name })
        void queryClient.invalidateQueries(trpc.workspace.get.queryOptions({ id: workspace.id }))
        toast.success('Workspace name updated successfully')
      },
      onError: (error) => {
        console.error('Failed to update workspace:', error)
        toast.error('Failed to update workspace name')
      },
    }),
  )

  // Delete workspace mutation
  const deleteWorkspaceMutation = useMutation(
    trpc.workspace.delete.mutationOptions({
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        toast.success('Workspace deleted successfully')
        router.push('/')
      },
      onError: (error) => {
        setIsDeleteDialogOpen(false)
        console.error('Failed to delete workspace:', error)
        toast.error('Failed to delete workspace')
      },
    }),
  )

  // Fetch workspace members
  const { data: membersData } = useQuery({
    ...trpc.workspace.listMembers.queryOptions({
      workspaceId: workspace.id,
      limit: 100,
    }),
    enabled: isOwner && isTransferDialogOpen,
  })

  // Transfer ownership mutation
  const transferOwnershipMutation = useMutation(
    trpc.workspace.transferOwner.mutationOptions({
      onSuccess: () => {
        setIsTransferDialogOpen(false)
        setSelectedUserId('')
        toast.success('Workspace ownership transferred successfully')

        // Refresh workspace data to update role
        void queryClient.invalidateQueries(trpc.workspace.get.queryOptions({ id: workspace.id }))
      },
      onError: (error) => {
        console.error('Failed to transfer ownership:', error)
        toast.error('Failed to transfer workspace ownership')
      },
    }),
  )

  return (
    <div className="space-y-6">
      {/* Workspace Name */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Name</CardTitle>
          <CardDescription>
            Update your workspace name. This will be visible to all members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                return updateWorkspaceMutation.mutateAsync({
                  id: workspace.id,
                  name: data.name.trim(),
                })
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Workspace name"
                        {...field}
                        disabled={!isOwner || form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      This is the name that will be displayed to all members.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={
                  !isOwner ||
                  form.formState.isSubmitting ||
                  form.watch('name').trim() === workspace.name
                }
              >
                {form.formState.isSubmitting ? (
                  <>
                    <CircleSpinner />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
              {!isOwner && (
                <p className="text-sm text-muted-foreground mt-2">
                  Only workspace owners can change the workspace name.
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Transfer Ownership */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Transfer Ownership</CardTitle>
          <CardDescription>
            Transfer ownership of this workspace to another member. You will become a regular
            member.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Select a member to transfer ownership to. This action cannot be undone.
          </p>
          <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!isOwner}>
                <UserPlus className="h-4 w-4" />
                Transfer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Workspace Ownership</DialogTitle>
                <DialogDescription>
                  Select a member to transfer ownership to. This action cannot be undone. You will
                  become a regular member of the workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={transferOwnershipMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {membersData?.members
                      .filter((member) => member.user.id !== workspace.id)
                      .map((member) => (
                        <SelectItem key={member.user.id} value={member.user.id}>
                          {member.user.info.firstName} {member.user.info.lastName} (
                          {member.user.info.username})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsTransferDialogOpen(false)}
                  disabled={transferOwnershipMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUserId) {
                      return transferOwnershipMutation.mutateAsync({
                        workspaceId: workspace.id,
                        userId: selectedUserId,
                      })
                    }
                  }}
                  disabled={!selectedUserId || transferOwnershipMutation.isPending}
                >
                  {transferOwnershipMutation.isPending ? (
                    <>
                      <CircleSpinner />
                      Transferring...
                    </>
                  ) : (
                    'Transfer Ownership'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
        <CardFooter>
          {!isOwner && (
            <p className="text-sm text-muted-foreground">
              Only workspace owners can transfer ownership.
            </p>
          )}
        </CardFooter>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Actions here can't be undone. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delete Workspace */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Delete Workspace</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete this workspace and all associated data.
              </p>
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!isOwner}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the workspace "
                    {workspace.name}" and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteWorkspaceMutation.isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      return deleteWorkspaceMutation.mutateAsync({ id: workspace.id })
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteWorkspaceMutation.isPending ? (
                      <>
                        <CircleSpinner />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
        <CardFooter>
          {!isOwner && (
            <p className="text-sm text-muted-foreground">
              Only workspace owners can perform these actions.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
