import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { RouterInputs, RouterOutputs } from '@cared/api'

import { orpc } from '@/lib/orpc'

export type CaredFunction =
  RouterOutputs['account']['function']['listCaredFunctions']['functions'][number]
export type FunctionRegion = RouterOutputs['account']['function']['listRegions']['regions'][number]

export function useFunctionRegions() {
  return useQuery(orpc.account.function.listRegions.queryOptions())
}

export function useCaredFunctions() {
  return useQuery({
    ...orpc.account.function.listCaredFunctions.queryOptions(),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const functions = query.state.data?.functions ?? []
      return functions.some((fn) =>
        ['waiting', 'processing', 'building'].includes(
          fn.primaryFunction?.latestDeploymentStatus ?? '',
        ),
      )
        ? 5000
        : false
    },
  })
}

export function useCaredFunction(id: string | undefined) {
  return useQuery({
    ...orpc.account.function.getCaredFunction.queryOptions({
      input: { id: id ?? '' },
    }),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.function.primaryFunction?.latestDeploymentStatus
      return status && ['waiting', 'processing', 'building'].includes(status) ? 5000 : false
    },
  })
}

export function useFunctionDeployments(fn: CaredFunction | null) {
  const primaryFunctionId = fn?.primaryFunction?.id

  return useQuery({
    ...orpc.account.function.listDeployments.queryOptions({
      input: {
        regionId: fn?.primaryRegionId ?? '',
        functionId: primaryFunctionId ?? '',
        limit: 20,
      },
    }),
    enabled: !!fn && !!primaryFunctionId,
    refetchInterval: (query) => {
      const deployments = query.state.data?.deployments ?? []
      return deployments.some((deployment) =>
        ['waiting', 'processing', 'building'].includes(deployment.status),
      )
        ? 5000
        : false
    },
  })
}

export function useCreateCaredFunction() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.function.createCaredFunction.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.account.function.listCaredFunctions.key(),
        })
      },
    }),
  })
}

export function useFunctionRuntimes(regionId: string | undefined) {
  return useQuery({
    ...orpc.account.function.listRuntimes.queryOptions({
      input: { regionId: regionId ?? '' },
    }),
    enabled: !!regionId,
  })
}

export type CreateCaredFunctionInput = RouterInputs['account']['function']['createCaredFunction']
export type FunctionDeployment =
  RouterOutputs['account']['function']['listDeployments']['deployments'][number]
