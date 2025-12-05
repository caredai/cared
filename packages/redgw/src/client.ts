import * as dns from 'node:dns'
import * as fs from 'node:fs'
import { FalkorDB } from 'falkordb'

let falkor: Promise<FalkorDB> | undefined

export async function getFalkor() {
  falkor ??= (async () => {
    const password = fs.readFileSync('/etc/redis-password', 'utf8')

    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const addresses = await dns.promises.resolve4(process.env.REDIS_CLUSTER_HEADLESS_SERVICE!)
    console.log('Redis cluster nodes:', addresses.join(', '))

    if (addresses.length < 3) {
      throw new Error('Not enough Redis cluster nodes')
    }

    return await FalkorDB.connectCluster({
      rootNodes: addresses.slice(0, 3).map((addr) => ({
        url: `redis://${addr}:30001`,
      })),
      defaults: {
        username: 'default',
        password,
      },
    })
  })()

  return await falkor
}
