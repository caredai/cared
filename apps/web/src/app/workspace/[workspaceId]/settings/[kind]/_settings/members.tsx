'use client'

import type { Workspace } from '@/hooks/use-workspace'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Trash2, UserPlus, X } from 'lucide-react'

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
} from '@ownxai/ui/components/alert-dialog'
import { Avatar, AvatarImage } from '@ownxai/ui/components/avatar'
import { Badge } from '@ownxai/ui/components/badge'
import { Button } from '@ownxai/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@ownxai/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@ownxai/ui/components/dialog'
import { Input } from '@ownxai/ui/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ownxai/ui/components/table'

import { useTRPC } from '@/trpc/client'

/**
 * Members settings component for workspace
 * Allows managing workspace members (add, remove)
 */
export function Members({ workspace }: { workspace: Workspace }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const isOwner = workspace.role === 'owner'

  // Fetch workspace members
  const { data: membersData, isLoading } = useQuery({
    ...trpc.workspace.listMembers.queryOptions({
      workspaceId: workspace.id,
    }),
  })

  // Add member mutation
  const addMemberMutation = useMutation(
    trpc.workspace.addMember.mutationOptions({
      onSuccess: () => {
        setIsAddMemberDialogOpen(false)
        setNewMemberEmail('')

        // Refresh members list
        void queryClient.invalidateQueries({
          queryKey: trpc.workspace.listMembers.queryOptions({
            workspaceId: workspace.id,
          }).queryKey,
        })
      },
    }),
  )

  // Delete member mutation
  const deleteMemberMutation = useMutation(
    trpc.workspace.deleteMember.mutationOptions({
      onSuccess: () => {
        setMemberToDelete(null)

        // Refresh members list
        void queryClient.invalidateQueries({
          queryKey: trpc.workspace.listMembers.queryOptions({
            workspaceId: workspace.id,
          }).queryKey,
        })
      },
    }),
  )

  // Handle add member
  const handleAddMember = () => {
    if (newMemberEmail) {
      addMemberMutation.mutate({
        workspaceId: workspace.id,
        userId: newMemberEmail,
        role: 'member',
      })
    }
  }

  // Handle delete member
  const handleDeleteMember = () => {
    if (memberToDelete) {
      deleteMemberMutation.mutate({
        workspaceId: workspace.id,
        userId: memberToDelete,
      })
    }
  }

  // Filter members based on search query
  const filteredMembers = membersData?.members.filter((member) => {
    if (!searchQuery) return true

    return (
      member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workspace Members</CardTitle>
              <CardDescription>
                Manage members of your workspace. Add or remove team members.
              </CardDescription>
            </div>
            <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!isOwner}>
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Workspace Member</DialogTitle>
                  <DialogDescription>
                    Enter the email or user ID of the person you want to add to this workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Email or User ID"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    disabled={addMemberMutation.isPending}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddMemberDialogOpen(false)}
                    disabled={addMemberMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddMember}
                    disabled={!newMemberEmail || addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Loading members...
                    </TableCell>
                  </TableRow>
                ) : filteredMembers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      {searchQuery ? 'No members found matching your search.' : 'No members found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers?.map((member) => (
                    <TableRow key={member.user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {member.user.image ? (
                              <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={member.user.image} alt={member.user.name} />
                              </Avatar>
                            ) : (
                              <span className="text-xs font-medium">
                                {member.user.name.slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div>{member.user.name}</div>
                            <div className="text-xs text-muted-foreground">{member.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role === 'owner' ? 'Owner' : 'Member'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isOwner && member.role !== 'owner' && (
                          <AlertDialog
                            open={memberToDelete === member.user.id}
                            onOpenChange={(open) => {
                              if (!open) setMemberToDelete(null)
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMemberToDelete(member.user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.user.name} from this
                                  workspace? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteMember}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteMemberMutation.isPending ? 'Removing...' : 'Remove'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          {!isOwner && (
            <p className="text-sm text-muted-foreground">
              Only workspace owners can add or remove members.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
