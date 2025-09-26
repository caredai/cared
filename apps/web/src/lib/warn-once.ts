import { env } from '@/env'

let warnOnce = (_: string) => {
  /* empty */
}
if (env.NODE_ENV !== 'production') {
  const warnings = new Set<string>()
  warnOnce = (msg: string) => {
    if (!warnings.has(msg)) {
      console.warn(msg)
    }
    warnings.add(msg)
  }
}

export { warnOnce }
