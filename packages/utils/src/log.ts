import type { LogFn } from 'pino'
import pino from 'pino'
import pretty from 'pino-pretty'

import { env } from './env'

const customLevels: Record<string, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  log: 29,
  progress: 28,
  success: 27,
  debug: 20,
  trace: 10,
}

const createStream = () => {
  if (env.LOG_FORMAT === 'pretty') {
    return pretty({
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    })
  }
}

const options = {
  level: env.LOG_LEVEL,
  customLevels,
  hooks: {
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

export const log = pino(options, createStream())

export default log
