import type { LogFn, LoggerOptions } from 'pino'

import { env } from './env'

let log = console

async function setup() {
  // @ts-ignore
  if (typeof globalThis.window !== 'undefined' || process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  const pino = await import('pino')
  const pretty = await import('pino-pretty')

  const createStream = () => {
    if (env.LOG_FORMAT === 'pretty' && process.env.NEXT_RUNTIME === 'nodejs') {
      return pretty.default({
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      })
    }
  }

  const options: LoggerOptions = {
    level: env.LOG_LEVEL,
    hooks: {
      // @ts-ignore
      logMethod(inputArgs: [string | Record<string, unknown>, ...unknown[]], method: LogFn): void {
        const [arg0, ...rest] = inputArgs

        if (typeof arg0 === 'object') {
          const messageParts = rest.map((arg) =>
            typeof arg === 'string' ? arg : JSON.stringify(arg),
          )
          const message = messageParts.join(' ')
          // @ts-ignore
          method.apply(this, [arg0, message])
        } else {
          const context = {
            ...inputArgs.filter((part) => typeof part === 'object'),
          }
          const message = inputArgs.filter((part) => typeof part === 'string').join(' ')

          // @ts-ignore
          method.apply(this, [context, message])
        }
      },
    },
  }

  // @ts-ignore
  log = pino.default(options, createStream())
}

void setup()

export { log }

export default log
