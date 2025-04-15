import type { TiktokenModel } from 'js-tiktoken'
import { Tokenizer as WebTokenizer } from '@agnai/web-tokenizers'
import { encodingForModel, Tiktoken } from 'js-tiktoken'

const tokenizersCache: Record<string, Tiktoken> = {}

export function getTiktokenTokenizer(model: TiktokenModel): Tiktoken {
  if (tokenizersCache[model]) {
    return tokenizersCache[model]
  }

  const tokenizer = encodingForModel(model)
  console.info('Instantiated the tokenizer for', model)
  tokenizersCache[model] = tokenizer
  return tokenizer
}

export async function getWebTokenizer(model: ArrayBuffer, isJson: boolean): Promise<WebTokenizer> {
  if (isJson) {
    return await WebTokenizer.fromJSON(model)
  } else {
    return await WebTokenizer.fromSentencePiece(model)
  }
}

export function getTiktokenChunks(tokenizer: Tiktoken, ids: number[]): string[] {
  const chunks = []

  for (const id of ids) {
    const chunkText = tokenizer.decode([id])
    chunks.push(chunkText)
  }

  return chunks
}

export function getWebTokenizersChunks(tokenizer: WebTokenizer, ids: number[]): string[] {
  const chunks: string[] = []

  for (let i = 0, lastProcessed = 0; i < ids.length; i++) {
    const chunkIds = ids.slice(lastProcessed, i + 1)
    const chunkText = tokenizer.decode(new Int32Array(chunkIds))
    if (chunkText === '�') {
      continue
    }
    chunks.push(chunkText)
    lastProcessed = i + 1
  }

  return chunks
}

export function getTokenizerModel(modelId: string) {
  if (
    modelId === 'o1' ||
    modelId.includes('o1-preview') ||
    modelId.includes('o1-mini') ||
    modelId.includes('o3-mini')
  ) {
    return 'o1'
  }

  if (modelId.includes('gpt-4o') || modelId.includes('chatgpt-4o-latest')) {
    return 'gpt-4o'
  }

  if (modelId.includes('gpt-4.5-preview')) {
    return 'gpt-4o'
  }

  if (modelId.includes('gpt-4-32k')) {
    return 'gpt-4-32k'
  }

  if (modelId.includes('gpt-4')) {
    return 'gpt-4'
  }

  if (modelId.includes('gpt-3.5-turbo-0301')) {
    return 'gpt-3.5-turbo-0301'
  }

  if (modelId.includes('gpt-3.5-turbo')) {
    return 'gpt-3.5-turbo'
  }

  if (modelId.includes('claude')) {
    return 'claude'
  }

  if (modelId.includes('gemma') || modelId.includes('gemini')) {
    return 'gemma'
  }

  if (modelId.includes('deepseek')) {
    return 'deepseek'
  }

  if (modelId.includes('qwen2')) {
    return 'qwen2'
  }

  // default
  return 'gpt-3.5-turbo'
}

export async function getTokenizer(
  modelId: string,
  fetchModel: (modelFilename: string) => Promise<ArrayBuffer>,
) {
  const model = getTokenizerModel(modelId)

  let modelFilename = ''
  switch (model) {
    case 'claude':
      modelFilename = 'claude.json'
      break
    case 'gemma':
      modelFilename = 'gemma.model'
      break
    case 'qwen2':
      modelFilename = 'qwen2.json'
      break
    case 'deepseek':
      modelFilename = 'deepseek.json'
      break
  }

  if (modelFilename) {
    const isJson = modelFilename.endsWith('.json')
    const tokenizer = await getWebTokenizer(await fetchModel(modelFilename), isJson)
    ;(tokenizer as any).isSentencePiece = !isJson
    return tokenizer
  }

  return getTiktokenTokenizer(model as TiktokenModel)
}

export async function tokenizerEncode(
  text: string,
  modelId: string,
  fetchModel: (modelFilename: string) => Promise<ArrayBuffer>,
): Promise<{
  tokens: number[]
  count: number
  chunks: string[]
}> {
  const tokenizer = await getTokenizer(modelId, fetchModel)
  const tokens = Array.from(tokenizer.encode(text))
  const chunks =
    tokenizer instanceof Tiktoken
      ? getTiktokenChunks(tokenizer, tokens)
      : getWebTokenizersChunks(tokenizer, tokens)
  return { tokens, count: tokens.length, chunks }
}

export async function tokenizerDecode(
  tokens: number[],
  modelId: string,
  fetchModel: (modelFilename: string) => Promise<ArrayBuffer>,
): Promise<string> {
  const tokenizer = await getTokenizer(modelId, fetchModel)
  return tokenizer instanceof Tiktoken
    ? tokenizer.decode(tokens)
    : tokenizer.decode(new Int32Array(tokens))
}

export async function tokenizerCount(
  messages: Record<string, string>[],
  modelId: string,
  fetchModel: (modelFilename: string) => Promise<ArrayBuffer>,
): Promise<number> {
  const tokenizer = await getTokenizer(modelId, fetchModel)

  if (tokenizer instanceof Tiktoken) {
    const tokensPerName = modelId.includes('gpt-3.5-turbo-0301') ? -1 : 1
    const tokensPerMessage = modelId.includes('gpt-3.5-turbo-0301') ? 4 : 3
    const tokensPadding = 3

    let count = 0
    for (const msg of messages) {
      try {
        count += tokensPerMessage
        for (const [key, value] of Object.entries(msg)) {
          count += tokenizer.encode(value).length
          if (key == 'name') {
            count += tokensPerName
          }
        }
      } catch (err: any) {
        console.warn(`Tokenizing message ${JSON.stringify(msg)} error ${err}`)
      }
    }
    count += tokensPadding

    // NB: Since 2023-10-14, the GPT-3.5 Turbo 0301 model shoves in 7-9 extra tokens to every message.
    // More details: https://community.openai.com/t/gpt-3-5-turbo-0301-showing-different-behavior-suddenly/431326/14
    if (modelId.includes('gpt-3.5-turbo-0301')) {
      count += 9
    }

    return count
  } else {
    if ((tokenizer as any).isSentencePiece) {
      const json = messages.flatMap((msg) => Object.values(msg)).join('\n\n')
      return tokenizer.encode(json).length
    } else {
      const convertedPrompt = convertClaudePrompt(messages, false, '', false, false, '', false)
      return tokenizer.encode(convertedPrompt).length
    }
  }
}

export function convertClaudePrompt(
  messages: Record<string, string>[],
  addAssistantPostfix: boolean,
  addAssistantPrefill: string,
  withSysPromptSupport: boolean,
  useSystemPrompt: boolean,
  addSysHumanMsg: string,
  excludePrefixes: boolean,
) {
  const msgs = messages as any

  // Prepare messages for claude.
  // When 'Exclude Human/Assistant prefixes' checked, setting messages role to the 'system'(last message is exception).
  if (msgs.length > 0) {
    messages.forEach((m) => {
      if (!m.content) {
        m.content = ''
      }
      if (m.tool_calls) {
        m.content += JSON.stringify(m.tool_calls)
      }
    })
    if (excludePrefixes) {
      messages.slice(0, -1).forEach((message) => (message.role = 'system'))
    } else {
      msgs[0].role = 'system'
    }
    // Add the assistant's message to the end of messages.
    if (addAssistantPostfix) {
      msgs.push({
        role: 'assistant',
        content: addAssistantPrefill || '',
      })
    }
    // Find the index of the first message with an assistant role and check for a "'user' role/Human:" before it.
    let hasUser = false
    const firstAssistantIndex = messages.findIndex((message, i) => {
      if (i >= 0 && (message.role === 'user' || message.content?.includes('\n\nHuman: '))) {
        hasUser = true
      }
      return message.role === 'assistant' && i > 0
    })
    // When 2.1+ and 'Use system prompt' checked, switches to the system prompt format by setting the first message's role to the 'system'.
    // Inserts the human's message before the first the assistant one, if there are no such message or prefix found.
    if (withSysPromptSupport && useSystemPrompt) {
      msgs[0].role = 'system'
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (firstAssistantIndex > 0 && addSysHumanMsg && !hasUser) {
        msgs.splice(firstAssistantIndex, 0, {
          role: 'user',
          content: addSysHumanMsg,
        })
      }
    } else {
      // Otherwise, use the default message format by setting the first message's role to 'user'(compatible with all claude models including 2.1.)
      msgs[0].role = 'user'
      // Fix messages order for default message format when(messages > Context Size) by merging two messages with "\n\nHuman: " prefixes into one, before the first Assistant's message.
      if (firstAssistantIndex > 0 && !excludePrefixes) {
        msgs[firstAssistantIndex - 1].role =
          firstAssistantIndex - 1 !== 0 && msgs[firstAssistantIndex - 1].role === 'user'
            ? 'FixHumMsg'
            : msgs[firstAssistantIndex - 1].role
      }
    }
  }

  // Convert messages to the prompt.
  return messages
    .map((v, i) => {
      // Set prefix according to the role. Also, when "Exclude Human/Assistant prefixes" is checked, names are added via the system prefix.
      const prefix =
        {
          assistant: '\n\nAssistant: ',
          user: '\n\nHuman: ',
          system:
            i === 0
              ? ''
              : v.name === 'example_assistant'
                ? '\n\nA: '
                : v.name === 'example_user'
                  ? '\n\nH: '
                  : excludePrefixes && v.name
                    ? `\n\n${v.name}: `
                    : '\n\n',
          FixHumMsg: '\n\nFirst message: ',
        }[v.role!] ?? ''
      // Claude doesn't support message names, so we'll just add them to the message content.
      return `${prefix}${v.name && v.role !== 'system' ? `${v.name}: ` : ''}${v.content}`
    })
    .join('')
}
