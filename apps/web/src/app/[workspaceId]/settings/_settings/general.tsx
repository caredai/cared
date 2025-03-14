'use client'

import type { Workspace } from '@/hooks/use-workspace'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Trash2, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'

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
    defaultValues: {
      name: workspace.name,
    },
  })

  // Update workspace mutation
  const updateWorkspaceMutation = useMutation(
    trpc.workspace.update.mutationOptions({
      onSuccess: (data) => {
        form.reset({ name: data.workspace.name })
      },
    }),
  )

  // Delete workspace mutation
  const deleteWorkspaceMutation = useMutation(
    trpc.workspace.delete.mutationOptions({
      onSuccess: () => {
        router.push('/')
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

        // Refresh workspace data to update role
        void queryClient.invalidateQueries({
          queryKey: trpc.workspace.get.queryOptions({ id: workspace.id }).queryKey,
        })
      },
    }),
  )

  // Handle form submission
  const onSubmit = (values: { name: string }) => {
    updateWorkspaceMutation.mutate({
      id: workspace.id,
      name: values.name,
    })
  }

  // Handle transfer ownership
  const handleTransferOwnership = () => {
    if (selectedUserId) {
      transferOwnershipMutation.mutate({
        workspaceId: workspace.id,
        userId: selectedUserId,
      })
    }
  }

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Workspace name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the name that will be displayed to all members.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={!isOwner || updateWorkspaceMutation.isPending}>
                {updateWorkspaceMutation.isPending ? 'Saving...' : 'Save Changes'}
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
          {/* Transfer Ownership */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Transfer Ownership</h3>
              <p className="text-sm text-muted-foreground">
                Transfer ownership of this workspace to another member. You will become a regular
                member.
              </p>
            </div>
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!isOwner}>
                  <UserPlus className="mr-2 h-4 w-4" />
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
                    onClick={handleTransferOwnership}
                    disabled={!selectedUserId || transferOwnershipMutation.isPending}
                  >
                    {transferOwnershipMutation.isPending ? 'Transferring...' : 'Transfer Ownership'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

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
                  <Trash2 className="mr-2 h-4 w-4" />
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
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteWorkspaceMutation.mutate({ id: workspace.id })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteWorkspaceMutation.isPending ? 'Deleting...' : 'Delete'}
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
