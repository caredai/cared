import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { formatDistance } from 'date-fns'
import { Cloud, MoreHorizontal, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'

import { Button } from '@cared/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cared/ui/components/form'
import { Input } from '@cared/ui/components/input'
import { CircleSpinner } from '@cared/ui/components/spinner'

import type { Integration, IntegrationType } from '@/hooks/use-integration'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import {
  useAddCloudflare,
  useDeleteIntegration,
  useGithubInstallationUrl,
  useIntegrations,
} from '@/hooks/use-integration'

const addCloudflareSchema = z.object({
  apiToken: z.string().min(1, 'API token is required'),
})

type AddCloudflareFormValues = z.infer<typeof addCloudflareSchema>

/**
 * Integrations page content: GitHub and Cloudflare management.
 */
export function Integrations() {
  return (
    <>
      <SectionTitle
        title="Integrations"
        description="Manage GitHub and Cloudflare integrations. You can connect multiple accounts for each provider."
      />

      <div className="space-y-6">
        <GitHubIntegrationsCard />
        <CloudflareIntegrationsCard />
      </div>
    </>
  )
}

function GitHubIntegrationsCard() {
  const { integrations, isLoading } = useIntegrations('github')
  const { deleteIntegration, isDeleting } = useDeleteIntegration()
  const { redirectToGithub, isPending: isAdding } = useGithubInstallationUrl()

  if (isLoading) {
    return <SkeletonCard />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiGithub size={20} />
            <div>
              <CardTitle>GitHub</CardTitle>
              <CardDescription>
                Connect GitHub accounts or organizations. Install the app to grant access.
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => redirectToGithub()} disabled={isAdding}>
            {isAdding ? (
              <>
                <CircleSpinner />
                Redirecting...
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add GitHub
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {integrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 border rounded-md">
            <p className="text-sm text-muted-foreground">No GitHub integrations yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click &quot;Add GitHub&quot; to install the app and connect an account or
              organization.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {integrations.map((integration) => (
              <IntegrationRow
                key={integration.id}
                integration={integration}
                onDelete={() => void deleteIntegration(integration.id)}
                isDeleting={isDeleting}
                type="github"
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function CloudflareIntegrationsCard() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const { integrations, isLoading } = useIntegrations('cloudflare')
  const { addCloudflare, isAdding, error: addError } = useAddCloudflare()
  const { deleteIntegration, isDeleting } = useDeleteIntegration()

  const form = useForm<AddCloudflareFormValues>({
    resolver: zodResolver(addCloudflareSchema),
    defaultValues: { apiToken: '' },
  })

  const onSubmit = async (values: AddCloudflareFormValues) => {
    await addCloudflare(values.apiToken).then(() => {
      form.reset({ apiToken: '' })
      setAddDialogOpen(false)
    })
  }

  if (isLoading) {
    return <SkeletonCard />
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              <div>
                <CardTitle>Cloudflare</CardTitle>
                <CardDescription>
                  Connect Cloudflare accounts using an API token. Create tokens in Cloudflare
                  dashboard.
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} disabled={isAdding}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Cloudflare
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border rounded-md">
              <p className="text-sm text-muted-foreground">No Cloudflare integrations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click &quot;Add Cloudflare&quot; and enter your API token to connect an account.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {integrations.map((integration) => (
                <IntegrationRow
                  key={integration.id}
                  integration={integration}
                  onDelete={() => void deleteIntegration(integration.id)}
                  isDeleting={isDeleting}
                  type="cloudflare"
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cloudflare integration</DialogTitle>
            <DialogDescription>
              Enter your Cloudflare API token. The token will be stored securely and used to manage
              your Cloudflare resources. Create a token in the Cloudflare dashboard with the
              permissions you need.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="apiToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Token</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Your Cloudflare API token"
                        autoComplete="off"
                        disabled={isAdding}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {addError && (
                <p className="text-sm text-destructive">
                  {addError instanceof Error ? addError.message : 'Failed to add integration'}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <CircleSpinner />
                      Adding...
                    </>
                  ) : (
                    'Add'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function IntegrationRow({
  integration,
  onDelete,
  isDeleting,
  type,
}: {
  integration: Integration
  onDelete: () => void
  isDeleting: boolean
  type: IntegrationType
}) {
  const displayName =
    type === 'github' && integration.metadata.type === 'github'
      ? `${integration.metadata.account.name} (@${integration.metadata.account.login})`
      : type === 'cloudflare' && integration.metadata.type === 'cloudflare'
        ? integration.metadata.accountName
        : integration.identifier

  return (
    <li className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div className="flex flex-col min-w-0">
        <span className="font-medium truncate">{displayName}</span>
        <span className="text-sm text-muted-foreground">
          Added {formatDistance(integration.createdAt, new Date(), { addSuffix: true })}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isDeleting}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2Icon className="h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
