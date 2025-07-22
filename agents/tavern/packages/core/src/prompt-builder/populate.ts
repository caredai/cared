import type { ChatMetadata } from '../chat'
import type { CharacterFields } from '../macro'
import type { BuildPromptMessagesParams } from './builder'
import { extractExtensions } from '../character'
import { activateLorebooks, newTimedEffects } from '../lorebook'
import { parseDialogueExamples, parseDialogueExamplesAsMessages, Prompt } from '../prompt'
import { getRegexedString, RegexPlacement } from '../regex'
import { exampleMessagesBehavior } from '../settings'
import { ChatContext } from './chat-context'
import { PromptCollection, PromptMessage } from './message'
import { TokenCounter } from './token-counter'

export async function populatePromptMessages(
  params: BuildPromptMessagesParams & {
    substituteMacros: (content: string) => string
    characterFields: CharacterFields
  },
) {
  const {
    messages,
    chat,
    settings,
    modelPreset,
    persona,
    character,
    group,
    lorebooks,
    substituteMacros,
    characterFields,
  } = params

  if (!modelPreset.maxContext) {
    return []
  }

  const emBehavior = exampleMessagesBehavior(settings.miscellaneous.exampleMessagesBehavior)

  const characterExtensions = extractExtensions(character.content)
  const regexScripts = [...settings.regex.scripts, ...(characterExtensions.regex_scripts ?? [])]

  // Process chat history to replace macros and regexes
  const chatHistory = structuredClone(messages)
    .filter((m) => m.message.role !== 'system')
    .map((m, index) => {
      const regexType =
        m.message.role === 'user' ? RegexPlacement.USER_INPUT : RegexPlacement.AI_OUTPUT

      m.message.content.parts.forEach((part) => {
        if (part.type === 'text') {
          part.text = getRegexedString(regexScripts, part.text, regexType, substituteMacros, {
            isPrompt: true,
            depth: messages.length - index - 1,
          })
          part.text = substituteMacros(part.text)
        }
      })

      return m.message
    })

  const lorebook = await activateLorebooks({
    lorebooks,
    chatHistory,
    globalScanData: {
      personaDescription: characterFields.persona,
      characterDescription: characterFields.description,
      characterPersonality: characterFields.personality,
      characterDepthPrompt: characterFields.charDepthPrompt,
      scenario: characterFields.scenario,
      creatorNotes: characterFields.creatorNotes,
    },
    timedEffects:
      (chat.metadata.custom as ChatMetadata | undefined)?.lorebookTimedEffects ?? newTimedEffects(),
    character,
    group,
    chatId: chat.id,
    personaId: persona.id,
    modelPreset,
    lorebookSettings: settings.lorebook,
    tagsSettings: settings.tags,
    regexSettings: settings.regex,
    substituteMacros,
    countTokens: TokenCounter.instance.countTokens,
  })

  const context = new ChatContext()
  context.setTokenBudget(modelPreset.maxContext)

  const promptCollectionMap = new Map<string, PromptCollection>()

  async function addPromptMessage(prompt: Prompt, content?: string) {
    const collection = new PromptCollection(prompt.identifier)
    collection.add(
      await PromptMessage.fromContent(
        prompt.identifier,
        prompt.role ?? 'system',
        content ?? prompt.content ?? '',
      ),
    )
    promptCollectionMap.set(prompt.identifier, collection)
  }

  for (const prompt of modelPreset.prompts) {
    if (!prompt.marker) {
      await addPromptMessage(prompt)
    } else {
      switch (prompt.identifier) {
        case 'personaDescription':
          await addPromptMessage(prompt, characterFields.persona)
          break
        case 'charDescription':
          await addPromptMessage(prompt, characterFields.description)
          break
        case 'charPersonality':
          await addPromptMessage(prompt, characterFields.personality)
          break
        case 'scenario':
          await addPromptMessage(prompt, characterFields.scenario)
          break
        case 'dialogueExamples':
          {
            let mesExamplesArray = parseDialogueExamples(characterFields.mesExamplesRaw)
            for (const example of lorebook?.emEntries ?? []) {
              if (!example.content) {
                continue
              }
              const cleanedExample = parseDialogueExamples(example.content)
              if (example.position === 'before') {
                mesExamplesArray.unshift(...cleanedExample)
              } else {
                mesExamplesArray.push(...cleanedExample)
              }
            }

            if (emBehavior.stripExample) {
              mesExamplesArray = []
            }

            const examples = parseDialogueExamplesAsMessages(
              mesExamplesArray,
              persona.name,
              !group
                ? character.content.data.name
                : group.characters.map((c) => c.content.data.name),
            )

            const collection = new PromptCollection(prompt.identifier)

            const newExampleChat = await PromptMessage.fromContent(
              'newChat',
              'system',
              modelPreset.utilityPrompts.newExampleChatPrompt,
            )

            let i = 0
            for (const dialogue of examples) {
              collection.add(newExampleChat)
              const dialogueIndex = i++

              let j = 0
              for (const example of dialogue) {
                const promptIndex = j++
                const identifier = `dialogueExamples ${dialogueIndex}-${promptIndex}`
                collection.add(
                  await PromptMessage.fromContent(identifier, example.role, example.content),
                )
              }
            }

            promptCollectionMap.set(prompt.identifier, collection)
          }
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

  const relativePrompts: Prompt[] = modelPreset.prompts.filter(
    (p) => p.injection_position !== 'absolute',
  )
  const absolutePrompts: Prompt[] = modelPreset.prompts.filter(
    (p) => p.injection_position === 'absolute',
  )

  const promptMessages = []

  for (const prompt of relativePrompts) {
    const collection = promptCollectionMap.get(prompt.identifier)!
    for (const promptMsg of collection.messages) {
      if (promptMsg.message.content) {
        promptMessages.push(promptMsg)
      }
    }
  }
}
