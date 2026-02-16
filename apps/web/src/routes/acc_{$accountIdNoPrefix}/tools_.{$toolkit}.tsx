import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ToolkitDetail } from '@/components/tools'
import { useToolkits } from '@/hooks/use-tools'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/tools_/{$toolkit}')({
  component: RouteComponent,
})

function RouteComponent() {
  const { accountIdNoPrefix, toolkit: toolkitSlug } = Route.useParams()
  const navigate = useNavigate()
  const toolkits = useToolkits()
  const toolkit = toolkits.find((t) => t.slug === toolkitSlug)

  if (!toolkit) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Toolkit not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ToolkitDetail
        toolkit={toolkit}
        onBack={() => {
          void navigate({
            to: '/acc_{$accountIdNoPrefix}/tools',
            params: { accountIdNoPrefix },
          })
        }}
      />
    </div>
  )
}
