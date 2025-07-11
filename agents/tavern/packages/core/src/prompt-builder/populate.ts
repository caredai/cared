import type { Prompt } from '../prompt'
import type { BuildPromptMessagesParams } from './builder'
import { ChatContext } from './chat-context'
import { PromptMessage } from './message'

export async function populatePromptMessages(params: BuildPromptMessagesParams) {
  const { messages, chat, settings, modelPreset, model, persona, character, group } = params

  const context = new ChatContext()

  if (!modelPreset.maxContext) {
    return []
  }
  context.setTokenBudget(modelPreset.maxContext)

  const promptMessagesMap = new Map<string, PromptMessage>()

  async function addPromptMessage(prompt: Prompt, content?: string) {
    promptMessagesMap.set(prompt.identifier, await PromptMessage.fromContent(prompt.identifier,
      prompt.role ?? 'system', content ?? prompt.content ?? ''))
  }

  for (const prompt of modelPreset.prompts) {
    if (!prompt.marker) {
      await addPromptMessage(prompt)
    } else {
      switch (prompt.identifier) {
        case 'personaDescription':
          await addPromptMessage(prompt, persona.metadata.description)
          break
        case 'charDescription':
          await addPromptMessage(prompt, character.data.description)
          break
        case 'charPersonality':
          await addPromptMessage(prompt, character.data.personality)
          break
        case 'scenario':
          await addPromptMessage(prompt, character.data.scenario)
          break
        case 'dialogueExamples':
          await addPromptMessage(prompt, character.data.mes_example)
          break
        case 'chatHistory':
          // TODO
          break
        case 'worldInfoAfter':
          // TODO
          break
        case 'worldInfoBefore':
          // TODO
          break
      }
    }
  }

  const relativePrompts: Prompt[] = modelPreset.prompts.filter(p => p.injection_position !== 'absolute')
  const absolutePrompts: Prompt[] = modelPreset.prompts.filter(p => p.injection_position === 'absolute')

  const promptMessages = []

  for (const prompt of relativePrompts) {
    const promptMsg = promptMessagesMap.get(prompt.identifier)!
    if (promptMsg.message.content) {
      promptMessages.push(promptMsg)
    }
  }
}
