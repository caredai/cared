'use client'

import Image from 'next/image'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@ownxai/ui/components/button'
import { Card, CardContent, CardDescription, CardTitle } from '@ownxai/ui/components/card'

import { RemoteImage } from '@/components/image'
import { CircleSpinner } from '@/components/spinner'
import defaultLogo from '@/public/images/agent.png'
import { useTRPC } from '@/trpc/client'

export function Applications() {
  const trpc = useTRPC()
  const { data: apps, refetch } = useSuspenseQuery(trpc.user.oauthApps.queryOptions())

  const revokeMutation = useMutation(
    trpc.user.revokeOauthApp.mutationOptions({
      onSuccess: () => {
        void refetch()
      },
      onError: (error) => {
        console.error('Failed to revoke OAuth application:', error)
        toast.error(`Failed to revoke OAuth application: ${error.message}`)
      },
    }),
  )

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Authorized Applications</h1>
        <p className="text-muted-foreground mt-2">Manage your authorized OAuth applications</p>
      </div>

      <div className="space-y-4">
        {apps.apps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground">No authorized applications found</p>
            </CardContent>
          </Card>
        ) : (
          apps.apps.map((app) => (
            <Card key={app.clientId}>
              <CardContent className="flex items-center gap-4">
                <div className="relative h-16 w-16 min-w-16 rounded-md overflow-hidden">
                  {app.imageUrl ? (
                    <RemoteImage src={app.imageUrl} alt={app.name} fill className="object-cover" />
                  ) : (
                    <Image src={defaultLogo} alt="App Logo" fill className="object-cover" />
                  )}
                </div>
                <div className="max-w-1/4 sm:max-w-1/2 lg:max-w-none">
                  <CardTitle className="truncate">{app.name}</CardTitle>
                  <CardDescription className="truncate">
                    {app.access.updatedAt &&
                      `Last used at ${new Date(app.access.updatedAt).toLocaleDateString()} • `}
                    Owned by {app.owner.name}
                  </CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-auto"
                  onClick={() => void revokeMutation.mutate({ clientId: app.clientId })}
                  disabled={revokeMutation.isPending}
                >
                  {revokeMutation.isPending ? (
                    <>
                      <CircleSpinner className="h-4 w-4" />
                      Revoking...
                    </>
                  ) : (
                    'Revoke'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
