import { useState } from 'react'
import { KeyRound, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Card, CardContent } from '@cared/ui/components/card'
import { Checkbox } from '@cared/ui/components/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'

import { CopyButton } from '@/components/copy-button'
import { SectionTitle } from '@/components/section'
import {
  useCreateDatabaseBranchDatabase,
  useCreateDatabaseBranchRole,
  useDatabaseBranchDatabases,
  useDatabaseBranchRoleAction,
  useDatabaseBranchRoles,
  useDeleteDatabaseBranchDatabase,
} from '@/hooks/use-database'
import { RelativeTime } from './database-format'

interface BranchAuthProps {
  namespaceId: string
  branchId: string
}

export function BranchAuth({ namespaceId, branchId }: BranchAuthProps) {
  const roles = useDatabaseBranchRoles(namespaceId, branchId)
  const databases = useDatabaseBranchDatabases(namespaceId, branchId)
  const { createDatabaseBranchRole, isCreating: isCreatingRole } = useCreateDatabaseBranchRole(
    namespaceId,
    branchId,
  )
  const {
    getRolePassword,
    resetRolePassword,
    deleteRole,
    isPending: isRoleActionPending,
  } = useDatabaseBranchRoleAction(namespaceId, branchId)
  const { createDatabaseBranchDatabase, isCreating: isCreatingDatabase } =
    useCreateDatabaseBranchDatabase(namespaceId, branchId)
  const { deleteDatabaseBranchDatabase, isDeleting: isDeletingDatabase } =
    useDeleteDatabaseBranchDatabase(namespaceId, branchId)

  const [roleOpen, setRoleOpen] = useState(false)
  const [databaseOpen, setDatabaseOpen] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [noLogin, setNoLogin] = useState(false)
  const [databaseName, setDatabaseName] = useState('')
  const [databaseOwner, setDatabaseOwner] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({})

  const handleCreateRole = async () => {
    const name = roleName.trim()
    if (!name) {
      toast.error('Role name is required')
      return
    }
    await createDatabaseBranchRole({ name, noLogin })
    setRoleName('')
    setNoLogin(false)
    setRoleOpen(false)
  }

  const handleCreateDatabase = async () => {
    const name = databaseName.trim()
    if (!name) {
      toast.error('Database name is required')
      return
    }
    await createDatabaseBranchDatabase({
      name,
      ownerName: databaseOwner.trim() || undefined,
    })
    setDatabaseName('')
    setDatabaseOwner('')
    setDatabaseOpen(false)
  }

  const revealPassword = async (roleName: string) => {
    const result = await getRolePassword(roleName)
    setVisiblePasswords((current) => ({ ...current, [roleName]: result.password }))
  }

  const resetPassword = async (roleName: string) => {
    const result = await resetRolePassword(roleName)
    if (result.role.password) {
      setVisiblePasswords((current) => ({ ...current, [roleName]: result.role.password! }))
    }
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Auth"
        description="Manage Postgres roles and databases for this branch."
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold">Roles</h3>
          <Button size="sm" onClick={() => setRoleOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add role
          </Button>
        </div>

        <div className="space-y-2">
          {roles.map((role) => (
            <Card key={role.name}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4 text-sm">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-[120px] font-medium">{role.name}</div>
                <Badge variant="outline">{role.authenticationMethod ?? 'password'}</Badge>
                {role.protected && <Badge variant="secondary">Protected</Badge>}
                <RelativeTime value={role.updatedAt} muted={false} />
                {visiblePasswords[role.name] && (
                  <div className="flex min-w-0 flex-1 items-center gap-1 rounded-md bg-muted px-2 py-1">
                    <code className="truncate text-xs">{visiblePasswords[role.name]}</code>
                    <CopyButton value={visiblePasswords[role.name] ?? ''} />
                  </div>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isRoleActionPending || role.authenticationMethod === 'no_login'}
                    onClick={() => void revealPassword(role.name)}
                  >
                    Show password
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={isRoleActionPending || role.authenticationMethod === 'no_login'}
                    aria-label="Reset password"
                    onClick={() => void resetPassword(role.name)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={isRoleActionPending || role.protected}
                    aria-label="Delete role"
                    onClick={() => void deleteRole(role.name)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold">Databases</h3>
          <Button size="sm" onClick={() => setDatabaseOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add database
          </Button>
        </div>

        <div className="space-y-2">
          {databases.map((database) => (
            <Card key={database.name}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4 text-sm">
                <div className="min-w-[120px] font-medium">{database.name}</div>
                <span className="text-muted-foreground">Owner</span>
                <span>{database.ownerName}</span>
                <RelativeTime value={database.updatedAt} muted={false} />
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-auto"
                  disabled={isDeletingDatabase}
                  aria-label="Delete database"
                  onClick={() => void deleteDatabaseBranchDatabase(database.name)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role name</Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={noLogin}
                onCheckedChange={(checked) => setNoLogin(checked === true)}
              />
              No login
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isCreatingRole} onClick={() => void handleCreateRole()}>
              {isCreatingRole ? 'Creating…' : 'Create role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={databaseOpen} onOpenChange={setDatabaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create database</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="database-name">Database name</Label>
              <Input
                id="database-name"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="database-owner">Owner role</Label>
              <Input
                id="database-owner"
                value={databaseOwner}
                onChange={(e) => setDatabaseOwner(e.target.value)}
                placeholder="Defaults to database name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDatabaseOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isCreatingDatabase} onClick={() => void handleCreateDatabase()}>
              {isCreatingDatabase ? 'Creating…' : 'Create database'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
