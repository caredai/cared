import { Turbopuffer } from '@turbopuffer/turbopuffer'

import { env } from '../env'

let tpuf: Turbopuffer | undefined

export function getTurbopuffer() {
  tpuf ??= new Turbopuffer({
    apiKey: env.TURBOPUFFER_API_KEY,
    region: 'gcp-asia-southeast1',
  })

  return tpuf
}
