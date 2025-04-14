import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'

import { tokenizerEncode } from '@ownxai/tokenizer'

// import { appRouter } from '@ownxai/api'

type Bindings = {
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

/*
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
  }),
)
*/

app.get('/', (c) => {
  return c.text('Hello ownx!')
})

app.get('/tokenizer/encode', async (c) => {
  const text = c.req.query('text')
  const modelId = c.req.query('modelId')
  if (!text || !modelId) {
    return c.json({ error: 'Missing text or modelId' }, 400)
  }
  const result = await tokenizerEncode(text, modelId, async (modelFilename) => {
    const rep = await c.env.ASSETS.fetch(`/tokenizers/${modelFilename}`)
    if (!rep.ok) {
      throw new Error(`Failed to fetch tokenizer model: ${modelFilename}`)
    }
    return await rep.arrayBuffer()
  })
  return c.json(result)
})

export default app
