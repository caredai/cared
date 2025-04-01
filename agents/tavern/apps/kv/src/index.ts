import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'

type Bindings = {
  TAVERN: KVNamespace
  API_TOKEN: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware for API authentication
app.use(
  '/api/*',
  bearerAuth({
    verifyToken: async (token, c) => {
      return token === c.env.API_TOKEN
    },
  }),
)

// Health check endpoint
app.get('/api/ok', (c) => {
  return c.text('ok')
})

// Get value by key
app.get('/api/kv/:key', async (c) => {
  const key = c.req.param('key')
  try {
    const value = await c.env.TAVERN.get(key)
    if (value === null) {
      return c.json({ error: 'Key not found' }, 404)
    }
    return c.json({ value })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to get value' }, 500)
  }
})

// Set key-value pair
app.post('/api/kv/:key', async (c) => {
  const key = c.req.param('key')
  try {
    const body = await c.req.json()
    const { value, expirationTtl: ex } = body

    if (typeof value === 'undefined') {
      return c.json({ error: 'Value is required' }, 400)
    }

    let expirationTtl
    if (ex) {
      expirationTtl = parseInt(ex)
      if (expirationTtl < 60) {
        // Cloudflare Workers KV requires expirationTtl to be at least 60 seconds
        return c.json({ error: 'Invalid expirationTtl' }, 400)
      }
    }

    await c.env.TAVERN.put(key, value, {
      expirationTtl,
    })

    return c.json({}, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to set value' }, 500)
  }
})

// Delete key
app.delete('/api/kv/:key', async (c) => {
  const key = c.req.param('key')
  try {
    await c.env.TAVERN.delete(key)
    return c.json({}, 200)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to delete key' }, 500)
  }
})

// List all keys with optional prefix
app.get('/api/kv', async (c) => {
  try {
    const prefix = c.req.query('prefix') || ''
    const limit = parseInt(c.req.query('limit') || '100')
    const cursor = c.req.query('cursor')

    const options: KVNamespaceListOptions = {
      limit,
      prefix,
      cursor,
    }

    const result = await c.env.TAVERN.list(options)
    return c.json(result)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to list keys' }, 500)
  }
})

export default app
