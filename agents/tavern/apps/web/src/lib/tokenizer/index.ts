import { hashString } from '@tavern/core'

let worker: Worker | undefined = undefined

const getWorker = () => {
  if (!worker && typeof Worker !== 'undefined') {
    worker = new Worker(new URL('tokenizer.worker.ts', import.meta.url))
  }
  return worker
}

const countCache = new Map<string, number>()
let idCounter = 0

export async function countTokens(text: string, modelId?: string): Promise<number> {
  if (!modelId) {
    return 0
  }

  const cacheKey = `${modelId}-${hashString(text)}`
  const cachedCount = countCache.get(cacheKey)
  if (cachedCount !== undefined) {
    return cachedCount
  }

  const id = idCounter++

  return new Promise((resolve, reject) => {
    const worker = getWorker()

    if (!worker) {
      resolve(text.length)
      return
    }

    const handleMessage = (
      event: MessageEvent<{
        id: number
        tokenCount?: number
        error?: string
      }>,
    ) => {
      const data = event.data
      if (data.id === id) {
        worker.removeEventListener('message', handleMessage)
        if (typeof data.tokenCount === 'number') {
          countCache.set(cacheKey, data.tokenCount)

          resolve(data.tokenCount)
        } else {
          reject(new Error(data.error))
        }
      }
    }

    worker.addEventListener('message', handleMessage)

    worker.postMessage({ id, modelId, text })
  })
}
