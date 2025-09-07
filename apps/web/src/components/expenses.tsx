'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Server } from 'lucide-react'

import type { Expense } from '@cared/db/schema'
import type { GenerationDetails } from '@cared/providers'
import { Badge } from '@cared/ui/components/badge'
import { DataTable } from '@cared/ui/components/data-table'
import { Spinner } from '@cared/ui/components/spinner'

import type { ColumnDef } from '@tanstack/react-table'
import { SectionTitle } from '@/components/section'
import { useExpenses } from '@/hooks/use-expense'
import { useModels, useProviders } from '@/hooks/use-model'

// Helper function to extract provider ID from modelId
function getProviderIdFromModelId(modelId: string): string {
  return modelId.split(':')[0] ?? ''
}

// Helper function to get model name from modelId using models data
function getModelNameFromModelId(modelId: string, models: any): string {
  // First try to find the model in the models data
  const allModels = [
    ...(models.language ?? []),
    ...(models.image ?? []),
    ...(models.speech ?? []),
    ...(models.transcription ?? []),
    ...(models.textEmbedding ?? []),
  ]

  const foundModel = allModels.find((model: any) => model.id === modelId)
  if (foundModel?.name) {
    return foundModel.name
  }

  // Fallback to extracting from modelId if not found in models data
  return modelId.split(':').slice(1).join(':')
}

// Helper function to format tokens for language models
function formatTokens(details: GenerationDetails): string {
  if (details.type === 'language' && 'usage' in details) {
    const usage = details.usage as { inputTokens?: number; outputTokens?: number }
    const inputTokens = usage.inputTokens ?? 0
    const outputTokens = usage.outputTokens ?? 0
    return `${inputTokens} → ${outputTokens}`
  }
  return ''
}

// Helper function to calculate speed
function calculateSpeed(details: GenerationDetails): string {
  if (details.type === 'language' && 'usage' in details) {
    const usage = details.usage as { outputTokens?: number }
    const outputTokens = usage.outputTokens ?? 0
    const generationTimeSeconds = details.generationTime / 1000
    if (generationTimeSeconds > 0) {
      const tps = outputTokens / generationTimeSeconds
      return `${tps.toFixed(1)} tps`
    }
  }
  // For non-language models, show generation time
  const generationTimeSeconds = details.generationTime / 1000
  return `${generationTimeSeconds}s`
}

// Helper function to format latency
function formatLatency(details: GenerationDetails): string {
  return `${details.latency / 1000}s`
}

// Create columns function that takes providers and models as parameters
function createColumns(
  providers: { id: string; name: string; icon?: string }[],
  models: any,
): ColumnDef<Expense>[] {
  return [
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.original.createdAt
        return format(date, 'MMM d, h:mm a')
      },
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const details = row.original.details
        return (
          <Badge variant="secondary" className="capitalize">
            {details.type}
          </Badge>
        )
      },
    },
    {
      id: 'model',
      header: 'Provider / Model',
      cell: ({ row }) => {
        const details = row.original.details
        const providerId = getProviderIdFromModelId(details.modelId)
        const modelName = getModelNameFromModelId(details.modelId, models)

        // Find provider info
        const provider = providers.find((p) => p.id === providerId)

        return (
          <div className="flex items-center gap-2">
            <div className="relative h-5 w-5 overflow-hidden rounded-sm flex items-center">
              {provider?.icon ? (
                <Image
                  src={`/images/providers/${provider.icon}`}
                  alt={`${provider.name} logo`}
                  unoptimized={true}
                  width={20}
                  height={20}
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('opacity-0')
                    e.currentTarget.nextElementSibling?.classList.add('opacity-100')
                  }}
                />
              ) : null}
              <Server className="h-5 w-5 absolute top-0 left-0 opacity-0" />
            </div>
            <span className="font-medium">{modelName}</span>
          </div>
        )
      },
    },
    {
      id: 'tokens',
      header: 'Tokens',
      cell: ({ row }) => {
        const details = row.original.details
        const tokens = formatTokens(details)
        return tokens ? <span className="font-mono">{tokens}</span> : '-'
      },
    },
    {
      accessorKey: 'cost',
      header: 'Cost',
      cell: ({ row }) => {
        const cost = row.getValue<string | null>('cost')
        return <span className="font-mono">{cost ? `$ ${cost}` : 'N/A'}</span>
      },
    },
    {
      id: 'speed',
      header: 'Speed',
      cell: ({ row }) => {
        const details = row.original.details
        return <span className="font-mono">{calculateSpeed(details)}</span>
      },
    },
    {
      id: 'latency',
      header: 'Latency',
      cell: ({ row }) => {
        const details = row.original.details
        return <span className="font-mono">{formatLatency(details)}</span>
      },
    },
  ]
}

export function Expenses({ organizationId }: { organizationId?: string }) {
  const [pageSize, setPageSize] = useState(20)
  
  const {
    expensesPages,
    isLoadingExpenses,
    fetchNextExpensesPage,
    hasNextExpensesPage,
    isFetchingNextExpensesPage,
  } = useExpenses({ organizationId, pageSize })

  // Get providers and models data
  const { providers } = useProviders()
  const { models } = useModels({ organizationId })

  // Flatten all pages of expenses into a single array
  const allExpenses = useMemo(() => {
    if (!expensesPages) return []
    return expensesPages.flatMap((page) => page.expenses)
  }, [expensesPages])

  // Create columns with providers and models data
  const columns = useMemo(() => createColumns(providers, models), [providers, models])

  if (isLoadingExpenses) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <SectionTitle title="Usage" description="View your usage and costs" />

      <DataTable
        columns={columns}
        data={allExpenses}
        enableInfiniteScroll={true}
        hasNextPage={hasNextExpensesPage}
        isFetchingNextPage={isFetchingNextExpensesPage}
        onFetchNextPage={fetchNextExpensesPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50]}
        className="text-muted-foreground"
      />
    </>
  )
}
