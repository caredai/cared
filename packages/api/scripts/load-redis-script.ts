import { Redis } from '@upstash/redis'

import * as scripts from '../src/operation/provider-key/lua-script'

async function main() {
  const redis = Redis.fromEnv({
    automaticDeserialization: false,
    enableAutoPipelining: true,
  })

  for (const [name, script] of Object.entries(scripts)) {
    if (typeof script === 'string' && name.endsWith('Script')) {
      const hash = await redis.scriptLoad(script)
      console.log(`Script ${name} loaded with hash:`, hash)
    }
  }
}

void main()
