import { useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'

import { useModelSettings } from '@/hooks/use-settings'
import { useTRPC } from '@/trpc/client'

export function useModels() {
  const trpc = useTRPC()

  const { data, refetch } = useSuspenseQuery({
    ...trpc.model.list.queryOptions(),
    // staleTime: Infinity,
    // gcTime: Infinity,
  })

  return {
    models: data.models,
    refetchModels: refetch,
  }
}

export function useActiveLanguageModel() {
  const { models: providerModels } = useModels()
  const { languageModel } = useModelSettings()

  const activeLanguageModel = useMemo(() => {
    for (const { models } of providerModels.language!) {
      const model = models.find((model) => model.id === languageModel)
      if (model) {
        return model
      }
    }
  }, [providerModels, languageModel])

  // TODO

  return {
    activeLanguageModel,
    activeLanguageModelId: activeLanguageModel?.id,
  }
}
