'use client'

import { useCallback } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { App as AppType } from '@ownxai/db/schema'

import { UploadLogo } from '@/components/upload-logo'
import defaultLogo from '@/public/images/agent.png'
import { useTRPC } from '@/trpc/client'

export function App({ appId }: { appId: string }) {
  const trpc = useTRPC()

  // Get app information
  const {
    data: { app },
  } = useSuspenseQuery({
    ...trpc.app.byId.queryOptions({
      id: appId,
    }),
  })

  return <UpdateAppLogo app={app} />
}

function UpdateAppLogo({ app }: { app: AppType }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // App update mutation
  const updateMutation = useMutation({
    ...trpc.app.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.app.byId.queryOptions({
            id: app.id,
          }),
        )
      },
      onError: (error) => {
        console.error('Failed to update app logo:', error)
        toast.error(`Failed to update app logo: ${error.message}`)
      },
    }),
  })

  const onLogoUrlChange = useCallback(
    async (logoUrl: string) => {
      if (logoUrl !== app.metadata.imageUrl) {
        await updateMutation.mutateAsync({
          id: app.id,
          metadata: {
            imageUrl: logoUrl,
          },
        })
      }
    },
    [app, updateMutation],
  )

  return (
    <div className="container mx-auto px-4 sm:px-0">
      <UploadLogo
        location={{
          type: 'app',
          appId: app.id,
        }}
        logoUrl={app.metadata.imageUrl}
        onLogoUrlChange={onLogoUrlChange}
        defaultLogo={defaultLogo}
      />
    </div>
  )
}
