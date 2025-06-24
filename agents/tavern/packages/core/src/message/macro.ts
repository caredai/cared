import { differenceInMilliseconds, format, formatDistanceToNow, parseISO } from 'date-fns'
import droll from 'droll'
import seedrandom from 'seedrandom'
import { v4 as uuid } from 'uuid'

import type { ModelInfo } from '@ownxai/sdk'

import type { ModelPreset } from '../model-preset'
import type { ReducedChat, ReducedMessage } from './prompt'
import type { MessageAnnotation, MessageNode } from './types'
import {
  addVariable,
  decrementVariable,
  getVariable,
  incrementVariable,
  setVariable,
} from '../variable'

type StrMaybeFunc = string | (() => string)

function evaluateStr(str: StrMaybeFunc): () => string {
  return () => {
    return typeof str === 'function' ? str() : str
  }
}

export interface Environment {
  user: StrMaybeFunc
  char: StrMaybeFunc
  charIfNotGroup: StrMaybeFunc
  group: StrMaybeFunc
  groupNotMuted: StrMaybeFunc

  charPrompt: StrMaybeFunc
  charInstruction: StrMaybeFunc
  charJailbreak: StrMaybeFunc
  description: StrMaybeFunc
  personality: StrMaybeFunc
  scenario: StrMaybeFunc
  persona: StrMaybeFunc
  mesExamples: StrMaybeFunc
  mesExamplesRaw: StrMaybeFunc
  charVersion: StrMaybeFunc
  char_version: StrMaybeFunc

  original: StrMaybeFunc

  model: StrMaybeFunc

  input?: string

  chat: ReducedChat
  messages: ReducedMessage[]
  branch: MessageNode[]
  modelPreset: ModelPreset
  modelInfo: ModelInfo

  chatVariables: Record<string, any>
  globalVariables: Record<string, any>
}

export function evaluateMacros(
  content: string,
  env: Environment & Record<string, string | ((nonce: string) => string)>,
  postProcessFn: (s: string) => string = (s: string) => s,
) {
  if (!content) {
    return ''
  }

  const rawContent = content

  if (typeof env.original === 'string') {
    const original = env.original
    let originalSubstituted = false
    env.original = () => {
      if (originalSubstituted) {
        return ''
      }

      originalSubstituted = true
      return original
    }
  }

  const preEnvMacros = [
    // Legacy non-curly macros
    { regex: /<USER>/gi, replace: evaluateStr(env.user) },
    { regex: /<BOT>/gi, replace: evaluateStr(env.char) },
    { regex: /<CHAR>/gi, replace: evaluateStr(env.char) },
    { regex: /<CHARIFNOTGROUP>/gi, replace: evaluateStr(env.group) },
    { regex: /<GROUP>/gi, replace: evaluateStr(env.group) },
    getDiceRollMacro(),
    ...getVariableMacros(env.chatVariables, env.globalVariables),
    { regex: /{{newline}}/gi, replace: () => '\n' },
    { regex: /(?:\r?\n)*{{trim}}(?:\r?\n)*/gi, replace: () => '' },
    { regex: /{{noop}}/gi, replace: () => '' },
    { regex: /{{input}}/gi, replace: () => env.input ?? '' },
  ]

  const lastMessage = env.messages.at(-1)
  const lastUserMessage = env.messages.filter((m) => m.role === 'user').at(-1)
  const lastCharMessage = env.messages.filter((m) => m.role === 'assistant').at(-1)

  const lastNode = env.branch.at(-1)

  const getContent = (message?: ReducedMessage) => {
    return (
      message?.content.parts
        .map((p) => p.type === 'text' && p.text)
        .filter(Boolean)
        .join('\n') ?? ''
    )
  }

  const postEnvMacros = [
    { regex: /{{maxPrompt}}/gi, replace: () => String(env.modelPreset.maxContext ?? 0) },
    {
      regex: /{{lastMessage}}/gi,
      replace: () => getContent(lastMessage),
    },
    { regex: /{{lastMessageId}}/gi, replace: () => lastMessage?.id ?? '' },
    { regex: /{{lastUserMessage}}/gi, replace: () => getContent(lastUserMessage) },
    { regex: /{{lastCharMessage}}/gi, replace: () => getContent(lastCharMessage) },
    {
      regex: /{{firstIncludedMessageId}}/gi,
      replace: () =>
        env.messages.find(
          (m) => !!(m.content.annotations?.at(0) as MessageAnnotation | undefined)?.modelId,
        )?.id ?? '',
    },
    { regex: /{{firstDisplayedMessageId}}/gi, replace: () => env.messages.at(0)?.id ?? '' },
    {
      regex: /{{lastSwipeId}}/gi,
      replace: () => String(lastNode?.parent?.descendants.length ?? 1),
    },
    {
      regex: /{{currentSwipeId}}/gi,
      replace: () =>
        String((lastNode?.parent?.descendants.findIndex((node) => node === lastNode) ?? 0) + 1),
    },
    {
      regex: /{{idle_duration}}/gi,
      replace: () =>
        formatDistanceToNow(lastUserMessage?.createdAt ?? new Date(), { addSuffix: true }),
    },
    {
      regex: /{{reverse:(.+?)}}/gi,
      replace: (_: any, str: string) => Array.from(str).reverse().join(''),
    },
    { regex: /\{\{\/\/([\s\S]*?)\}\}/gm, replace: () => '' },
    { regex: /{{time}}/gi, replace: () => format(new Date(), 'h:mm a') },
    { regex: /{{date}}/gi, replace: () => format(new Date(), 'MMMM d, yyyy') },
    { regex: /{{weekday}}/gi, replace: () => format(new Date(), 'EEEE') },
    { regex: /{{isotime}}/gi, replace: () => format(new Date(), 'HH:mm') },
    { regex: /{{isodate}}/gi, replace: () => format(new Date(), 'yyyy-MM-dd') },
    {
      regex: /{{datetimeformat +([^}]*)}}/gi,
      replace: (_: any, formatStr: string) => format(new Date(), formatStr),
    },
    {
      regex: /{{time_UTC([-+]\d+)}}/gi,
      replace: (_: any, offset: string) => {
        const offsetHours = parseInt(offset, 10)
        return format(new Date(new Date().getTime() + offsetHours * 60 * 60 * 1000), 'h:mm a')
      },
    },
    getTimeDiffMacro(),
    getRandomReplaceMacro(),
    getPickReplaceMacro(rawContent, env.chat.id),
  ]

  const nonce = uuid()
  const envMacros = []

  // Substitute passed-in variables
  for (const varName in env) {
    if (!Object.hasOwn(env, varName)) continue

    const param = env[varName]
    if (typeof param !== 'function' && typeof param !== 'string') continue

    const envRegex = new RegExp(`{{${escapeRegex(varName)}}}`, 'gi')
    const envReplace = () => {
      return sanitizeMacroValue(typeof param === 'function' ? param(nonce) : param)
    }

    envMacros.push({ regex: envRegex, replace: envReplace })
  }

  const macros = [...preEnvMacros, ...envMacros, ...postEnvMacros]

  for (const macro of macros) {
    // Stop if the content is empty
    if (!content) {
      break
    }

    // Short-circuit if no curly braces are found
    if (!macro.regex.source.startsWith('<') && !content.includes('{{')) {
      break
    }

    try {
      // @ts-ignore
      content = content.replace(macro.regex, (...args) => postProcessFn(macro.replace(...args)))
    } catch (e) {
      console.warn(`Macro content can't be replaced: ${macro.regex} in ${content}`, e)
    }
  }

  return content
}

export function sanitizeMacroValue(value: any) {
  if (typeof value === 'string') {
    return value
  }

  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Promise) {
    console.warn('Promises are not supported as macro values')
    return ''
  }

  if (typeof value === 'function') {
    console.warn('Functions are not supported as macro values')
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Escapes a string for use in a regular expression.
 * @example
 * escapeRegex('^Hello$'); // '\\^Hello\\$'
 */
export function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}

export function getDiceRollMacro() {
  const rollPattern = /{{roll:([^}]+)}}/gi
  const rollReplace = (_: any, matchValue: string) => {
    let formula = matchValue.trim()

    if (isDigitsOnly(formula)) {
      formula = `1d${formula}`
    }

    const isValid = droll.validate(formula)

    if (!isValid) {
      console.debug(`Invalid roll formula: ${formula}`)
      return ''
    }

    const result = droll.roll(formula)
    if (result === false) return ''
    return String(result.total)
  }

  return { regex: rollPattern, replace: rollReplace }
}

export function isDigitsOnly(str: string) {
  return /^\d+$/.test(str)
}

function randomValue() {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return (array[0] ?? 0) / (0xffffffff + 1)
}

/**
 * Returns a macro that picks a random item from a list.
 */
function getRandomReplaceMacro() {
  const randomPattern = /{{random\s?::?([^}]+)}}/gi
  const randomReplace = (_: any, listString: string) => {
    // Split on either double colons or comma. If comma is the separator, we are also trimming all items.
    const list = listString.includes('::')
      ? listString.split('::')
      : // Replaced escaped commas with a placeholder to avoid splitting on them
        listString
          .replace(/\\,/g, '##�COMMA�##')
          .split(',')
          .map((item) => item.trim().replace(/##�COMMA�##/g, ','))

    if (list.length === 0) {
      return ''
    }
    const randomIndex = Math.floor(randomValue() * list.length)
    return list[randomIndex]
  }

  return { regex: randomPattern, replace: randomReplace }
}

const chatIdHashCache = new Map<string, number>()

function getChatIdHash(chatId: string) {
  let hash = chatIdHashCache.get(chatId)
  if (typeof hash === 'number') {
    return hash
  }

  hash = cyrb53(chatId)
  chatIdHashCache.set(chatId, hash)
  return hash
}

/**
 * Returns a macro that picks a random item from a list with a consistent seed.
 */
function getPickReplaceMacro(rawContent: string, chatId: string) {
  // We need to have a consistent chat hash, otherwise we'll lose rolls on chat file rename or branch switches
  // No need to save metadata here - branching and renaming will implicitly do the save for us, and until then loading it like this is consistent
  const chatIdHash = getChatIdHash(chatId)
  const rawContentHash = cyrb53(rawContent)

  const pickPattern = /{{pick\s?::?([^}]+)}}/gi
  const pickReplace = (_: any, listString: string, offset: number) => {
    // Split on either double colons or comma. If comma is the separator, we are also trimming all items.
    const list = listString.includes('::')
      ? listString.split('::')
      : // Replaced escaped commas with a placeholder to avoid splitting on them
        listString
          .replace(/\\,/g, '##�COMMA�##')
          .split(',')
          .map((item) => item.trim().replace(/##�COMMA�##/g, ','))

    if (list.length === 0) {
      return ''
    }

    // We build a hash seed based on: unique chat file, raw content, and the placement inside this content
    // This allows us to get unique but repeatable picks in nearly all cases
    const combinedSeedString = `${chatIdHash}-${rawContentHash}-${offset}`
    const finalSeed = cyrb53(combinedSeedString)
    // @ts-ignore - have to use numbers for legacy picks
    const rng = seedrandom(finalSeed)
    const randomIndex = Math.floor(rng() * list.length)
    return list[randomIndex]
  }

  return { regex: pickPattern, replace: pickReplace }
}

/**
 * A fast and simple 53-bit string hash function with decent collision resistance.
 * Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
 * https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 */
export function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/**
 * Returns the difference between two times. Works with any time format acceptable by date-fns.
 * Can work with {{date}} {{time}} macros.
 */
function getTimeDiffMacro() {
  const timeDiffPattern = /{{timeDiff::(.*?)::(.*?)}}/gi
  const timeDiffReplace = (_: any, matchPart1: string, matchPart2: string) => {
    // Parse the time strings to Date objects
    const time1 = parseISO(matchPart1.trim())
    const time2 = parseISO(matchPart2.trim())

    // Calculate the difference in milliseconds
    const diffInMs = differenceInMilliseconds(time1, time2)

    // Format the difference as a human-readable string
    return formatDistanceToNow(new Date(Date.now() + diffInMs), { addSuffix: true })
  }

  return { regex: timeDiffPattern, replace: timeDiffReplace }
}

export function getVariableMacros(
  chatVariables: Record<string, any>,
  globalVariables: Record<string, any>,
) {
  return [
    // Replace {{setvar::name::value}} with empty string and set the variable name to value
    {
      regex: /{{setvar::([^:]+)::([^}]+)}}/gi,
      replace: (_: any, name: string, value: string) => {
        setVariable(chatVariables, name.trim(), value)
        return ''
      },
    },
    // Replace {{addvar::name::value}} with empty string and add value to the variable value
    {
      regex: /{{addvar::([^:]+)::([^}]+)}}/gi,
      replace: (_: any, name: string, value: string) => {
        addVariable(chatVariables, name.trim(), value)
        return ''
      },
    },
    // Replace {{incvar::name}} with empty string and increment the variable name by 1
    {
      regex: /{{incvar::([^}]+)}}/gi,
      replace: (_: any, name: string) => incrementVariable(chatVariables, name.trim()),
    },
    // Replace {{decvar::name}} with empty string and decrement the variable name by 1
    {
      regex: /{{decvar::([^}]+)}}/gi,
      replace: (_: any, name: string) => decrementVariable(chatVariables, name.trim()),
    },
    // Replace {{getvar::name}} with the value of the variable name
    {
      regex: /{{getvar::([^}]+)}}/gi,
      replace: (_: any, name: string) => getVariable(chatVariables, name.trim()),
    },
    // Replace {{setglobalvar::name::value}} with empty string and set the global variable name to value
    {
      regex: /{{setglobalvar::([^:]+)::([^}]+)}}/gi,
      replace: (_: any, name: string, value: string) => {
        setVariable(globalVariables, name.trim(), value)
        return ''
      },
    },
    // Replace {{addglobalvar::name::value}} with empty string and add value to the global variable value
    {
      regex: /{{addglobalvar::([^:]+)::([^}]+)}}/gi,
      replace: (_: any, name: string, value: string) => {
        addVariable(globalVariables, name.trim(), value)
        return ''
      },
    },
    // Replace {{incglobalvar::name}} with empty string and increment the global variable name by 1
    {
      regex: /{{incglobalvar::([^}]+)}}/gi,
      replace: (_: any, name: string) => incrementVariable(globalVariables, name.trim()),
    },
    // Replace {{decglobalvar::name}} with empty string and decrement the global variable name by 1
    {
      regex: /{{decglobalvar::([^}]+)}}/gi,
      replace: (_: any, name: string) => decrementVariable(globalVariables, name.trim()),
    },
    // Replace {{getglobalvar::name}} with the value of the global variable name
    {
      regex: /{{getglobalvar::([^}]+)}}/gi,
      replace: (_: any, name: string) => getVariable(globalVariables, name.trim()),
    },
  ]
}
