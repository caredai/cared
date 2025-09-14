import type {
  LanguageModelV2Content,
  LanguageModelV2Text,
  LanguageModelV2ToolCall,
} from '@ai-sdk/provider'

export function extractTextContent(content: LanguageModelV2Content[]): string | undefined {
  const parts = content.filter((content): content is LanguageModelV2Text => content.type === 'text')

  if (parts.length === 0) {
    return undefined
  }

  return parts.map((content) => content.text).join('')
}

export function asToolCalls(content: LanguageModelV2Content[]) {
  const parts = content.filter((part): part is LanguageModelV2ToolCall => part.type === 'tool-call')

  if (parts.length === 0) {
    return undefined
  }

  return parts.map((toolCall) => ({
    toolCallId: toolCall.toolCallId,
    toolName: toolCall.toolName,
    input: toolCall.input,
  }))
}
