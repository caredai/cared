import { SuperJSON } from '@cared/shared'

export function createCustomFetch({
  onResponse,
  onLatency,
}: {
  onResponse?: (response: Response) => void | Promise<void>
  onLatency?: (latency: number) => void
}) {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const startTime = performance.now()
    const response = await fetch(input, init)
    const endTime = performance.now()

    if (onResponse) {
      void onResponse(response.clone())
    }
    if (onLatency) {
      onLatency(Math.floor(endTime - startTime))
    }
    return response
  }
}

export function createCustomJsonFetch<T extends Record<string, any>>({
  onResponse,
  onLatency,
}: {
  onResponse?: (response: T) => void
  onLatency?: (latency: number) => void
}) {
  return createCustomFetch({
    onResponse: async (response: Response) => {
      onResponse?.(SuperJSON.parse<T>(await response.text()))
    },
    onLatency,
  })
}
