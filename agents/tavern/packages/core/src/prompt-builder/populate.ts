import type { ChatMetadata } from '../chat'
import type { CharacterFields } from '../macro'
import type { Prompt } from '../prompt'
import type { ReducedMessage } from '../types'
import type { BuildPromptMessagesParams } from './builder'
import { extractExtensions } from '../character'
import {
  ExtensionInjectionPosition,
  ExtensionPromptManager,
  getExtensionPosition,
} from '../extension'
import { activateLorebooks, newTimedEffects } from '../lorebook'
import { getMessageText } from '../message'
import { PersonaPosition } from '../persona'
import { parseDialogueExamples, parseDialogueExamplesAsMessages } from '../prompt'
import { getRegexedString, RegexPlacement } from '../regex'
import { exampleMessagesBehavior } from '../settings'
import { formatSummary, getLatestSummary } from '../summary'
import { stringFormat } from '../utils'
import { addCharacterName } from './add-character-name'
import { ChatContext } from './chat-context'
import { DepthManager } from './depth'
import { PromptCollection, PromptMessage } from './message'
import { TokenCounter } from './token-counter'

export async function populatePromptMessages(
  params: BuildPromptMessagesParams & {
    substituteMacros: (content: string, additionalMacro?: Record<string, string>) => string
    characterFields: CharacterFields
  },
) {
  const {
    generateType,
    messages,
    chat,
    settings,
    modelPreset,
    model,
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

  const utilityPrompts = modelPreset.utilityPrompts

  const characterExtensions = extractExtensions(character.content)
  const regexScripts = [...settings.regex.scripts, ...(characterExtensions.regex_scripts ?? [])]

  // Process chat history to replace macros and regexes
  const _substituteMacros = (content: string) => substituteMacros(content)
  const chatHistory = structuredClone(messages)
    .filter((m) => m.message.role !== 'system')
    .map((m, index) => {
      const regexType =
        m.message.role === 'user' ? RegexPlacement.USER_INPUT : RegexPlacement.AI_OUTPUT

      m.message.content.parts.forEach((part) => {
        if (part.type === 'text') {
          part.text = getRegexedString(regexScripts, part.text, regexType, _substituteMacros, {
            isPrompt: true,
            depth: messages.length - index - 1,
          })
          part.text = substituteMacros(part.text)
        }
      })

      return m.message
    })

  const chatHistoryWithCharacterNames = chatHistory.map((m) =>
    addCharacterName(m, modelPreset, persona.name, !!group),
  )

  const extensionPromptManager = new ExtensionPromptManager()

  const summary = getLatestSummary(chatHistory)
  if (summary) {
    extensionPromptManager.add({
      name: 'summary',
      value: formatSummary(summary.summary, settings.summary, substituteMacros),
      position: settings.summary.injectionPosition,
      depth: settings.summary.depth,
      role: settings.summary.role,
    })
  }

  const lorebook = await activateLorebooks({
    lorebooks,
    chatHistory: settings.lorebook.includeNames ? chatHistoryWithCharacterNames : chatHistory,
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

  async function addPromptMessage(
    prompt: Pick<Prompt, 'identifier' | 'role' | 'content'>,
    content?: string,
  ) {
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

  const impersonateMessage = await PromptMessage.fromContent(
    'impersonate',
    'system',
    substituteMacros(utilityPrompts.impersonationPrompt),
  )

  for (const prompt of modelPreset.prompts) {
    if (!prompt.marker) {
      switch (prompt.identifier) {
        case 'main':
          if (characterFields.charPrompt && !prompt.forbid_overrides) {
            await addPromptMessage(prompt, characterFields.charPrompt)
          } else {
            await addPromptMessage(prompt)
          }
          break
        case 'jailbreak':
          if (characterFields.charJailbreak && !prompt.forbid_overrides) {
            await addPromptMessage(prompt, characterFields.charJailbreak)
          } else {
            await addPromptMessage(prompt)
          }
          break
        default:
          await addPromptMessage(prompt)
          break
      }
    } else {
      switch (prompt.identifier) {
        case 'personaDescription':
          if (persona.metadata.injectionPosition === PersonaPosition.InPrompt) {
            await addPromptMessage(prompt, characterFields.persona)
          }
          break
        case 'charDescription':
          await addPromptMessage(prompt, characterFields.description)
          break
        case 'charPersonality':
          await addPromptMessage(
            prompt,
            characterFields.personality && utilityPrompts.personalityFormat
              ? substituteMacros(utilityPrompts.personalityFormat)
              : characterFields.personality,
          )
          break
        case 'scenario':
          await addPromptMessage(
            prompt,
            characterFields.scenario && utilityPrompts.scenarioFormat
              ? substituteMacros(utilityPrompts.scenarioFormat)
              : characterFields.scenario,
          )
          break
        case 'dialogueExamples':
          // Process at the end
          break
        case 'chatHistory':
          // Process at the end
          break
        case 'worldInfoBefore':
          {
            await addPromptMessage(
              prompt,
              lorebook?.lorebookInfoBefore && utilityPrompts.worldInfoFormat
                ? stringFormat(utilityPrompts.worldInfoFormat, lorebook.lorebookInfoBefore)
                : '',
            )
          }
          break
        case 'worldInfoAfter':
          {
            await addPromptMessage(
              prompt,
              lorebook?.lorebookInfoAfter && utilityPrompts.worldInfoFormat
                ? stringFormat(utilityPrompts.worldInfoFormat, lorebook.lorebookInfoAfter)
                : '',
            )
          }
          break
      }
    }
  }

  const mainPromptCollection = promptCollectionMap.get('main')!

  {
    const summary = extensionPromptManager.get('summary')
    const summaryPosition = getExtensionPosition(summary?.position)
    if (summary && summaryPosition) {
      mainPromptCollection.insert(
        await PromptMessage.fromContent('summary', settings.summary.role, summary.value),
        summaryPosition,
      )
    }
  }

  const relativePrompts: Prompt[] = modelPreset.prompts.filter(
    (p) => p.injection_position !== 'absolute',
  )
  const absolutePrompts: [Prompt, PromptCollection][] = modelPreset.prompts
    .filter((p) => p.injection_position === 'absolute')
    .map((p) => {
      return [p, promptCollectionMap.get(p.identifier)]
    })
    .filter(([, collection]) => collection) as [Prompt, PromptCollection][]

  context.reserveBudget(3)

  const controlPrompts = new PromptCollection('controlPrompts')

  if (generateType === 'impersonate') {
    if (!impersonateMessage.isEmpty()) {
      controlPrompts.add(impersonateMessage)
    }
  }

  context.reserveBudget(controlPrompts)

  for (const prompt of relativePrompts) {
    const collection = promptCollectionMap.get(prompt.identifier)
    if (!collection) {
      continue
    }
    context.insertCollection(collection)
  }

  async function populateChatHistory() {
    interface InjectedMessage {
      role: 'system' | 'user' | 'assistant'
      content: string
    }

    function isInjectedMessage(
      message: ReducedMessage | InjectedMessage,
    ): message is InjectedMessage {
      return typeof message.content === 'string'
    }

    const reversedMessages: (ReducedMessage | InjectedMessage)[] =
      chatHistoryWithCharacterNames.reverse()
    {
      let totalInsertedMessages = 0

      const depthManager = new DepthManager()
      depthManager.add(...absolutePrompts.map(([p]) => p.injection_depth ?? 0))
      depthManager.merge(extensionPromptManager.depths)
      const roles = ['system', 'user', 'assistant'] as const
      for (const depth of depthManager.values()) {
        const depthMessages: InjectedMessage[] = []

        const depthPrompts = absolutePrompts.filter(
          ([p, c]) => p.injection_depth === depth && !c.isEmpty(),
        )

        for (const role of roles) {
          const prompt = depthPrompts
            .filter(([p]) => p.role === role)
            .map(([, c]) => c.getContent())
            .join('\n')
          const extensionPrompt = extensionPromptManager.prompt(
            ExtensionInjectionPosition.IN_CHAT,
            depth,
            role,
          )
          const jointPrompt = [substituteMacros(prompt), extensionPrompt].join('\n')
          depthMessages.push({
            role,
            content: jointPrompt,
          })
        }

        if (depthMessages.length) {
          const injectIdx = depth + totalInsertedMessages
          reversedMessages.splice(injectIdx, 0, ...depthMessages)
          totalInsertedMessages += depthMessages.length
        }
      }
    }

    context.insertCollection(new PromptCollection('chatHistory'))

    const newChatPrompt = !group ? utilityPrompts.newChatPrompt : utilityPrompts.newGroupChatPrompt
    const newChatMessage = await PromptMessage.fromContent(
      'newMainChat',
      'system',
      substituteMacros(newChatPrompt),
    )
    context.reserveBudget(newChatMessage)

    let groupNudgeMessage
    const noGroupNudgeTypes = ['impersonate']
    const hasGroupNudge = group && !noGroupNudgeTypes.includes(generateType)
    if (hasGroupNudge) {
      groupNudgeMessage = await PromptMessage.fromContent(
        'groupNudge',
        'system',
        substituteMacros(utilityPrompts.groupNudgePrompt),
      )
      context.reserveBudget(groupNudgeMessage)
    }

    let continueMessageCollection
    if (generateType === 'continue' && !modelPreset.continuePrefill) {
      const continueMessage = chatHistoryWithCharacterNames.splice(-1, 1)[0]
      if (continueMessage) {
        continueMessageCollection = new PromptCollection('continueNudge')

        continueMessageCollection.add(
          await PromptMessage.fromMessage('continueMessage', continueMessage),
        )

        continueMessageCollection.add(
          await PromptMessage.fromContent(
            'continueNudge',
            'system',
            substituteMacros(utilityPrompts.continueNudgePrompt, {
              lastChatMessage: getMessageText(continueMessage),
            }),
          ),
        )

        context.reserveBudget(continueMessageCollection)
      }
    }

    if (
      generateType === 'normal' &&
      chatHistoryWithCharacterNames.at(-1)?.role === 'assistant' &&
      modelPreset.utilityPrompts.sendIfEmpty
    ) {
      const message = await PromptMessage.fromContent(
        'emptyUserMessageReplacement',
        'user',
        substituteMacros(modelPreset.utilityPrompts.sendIfEmpty),
      )
      if (context.canAfford(message)) {
        context.insertMessage(message, 'chatHistory')
      }
    }

    let metFirstNonInjected = false
    for (let i = 0; i < reversedMessages.length; i++) {
      const msg = reversedMessages[i]!
      const chatMessage = await PromptMessage.fromContent(
        `chatHistory-${reversedMessages.length - i}`,
        msg.role,
        isInjectedMessage(msg) ? msg.content : getMessageText(msg),
      )

      if (!context.canAfford(chatMessage)) {
        break
      }

      if (
        generateType === 'continue' &&
        modelPreset.continuePrefill &&
        !isInjectedMessage(msg) &&
        !metFirstNonInjected
      ) {
        metFirstNonInjected = true

        const collection = new PromptCollection('continuePrefill')
        if (msg.role === 'assistant') {
          const supportsAssistantPrefill = model.id.startsWith('anthropic')
          const assistantPrefill = supportsAssistantPrefill
            ? substituteMacros(modelPreset.vendor?.claude?.assistantPrefill ?? '')
            : ''
          const messageContent = [assistantPrefill, chatMessage.getContent()]
            .filter((x) => x)
            .join('\n\n')
          const continueMessage = await PromptMessage.fromContent(
            chatMessage.identifier,
            msg.role,
            messageContent,
          )
          collection.add(continueMessage)
        } else {
          collection.add(chatMessage)
        }

        context.insertCollection(collection)

        continue
      }

      context.insertMessage(chatMessage, 'chatHistory', 'start')
    }

    context.freeBudget(newChatMessage)
    context.insertMessage(newChatMessage, 'chatHistory')

    if (hasGroupNudge && groupNudgeMessage) {
      context.freeBudget(groupNudgeMessage)
      context.insertMessage(groupNudgeMessage, 'chatHistory')
    }

    if (generateType === 'continue' && continueMessageCollection) {
      context.freeBudget(continueMessageCollection)
      context.insertCollection(continueMessageCollection)
    }
  }

  async function populateDialogueExamples() {
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
      !group ? character.content.data.name : group.characters.map((c) => c.content.data.name),
    )

    context.insertCollection(new PromptCollection('dialogueExamples'))

    const newExampleChat = await PromptMessage.fromContent(
      'newChat',
      'system',
      substituteMacros(utilityPrompts.newExampleChatPrompt),
    )

    let i = 0
    for (const dialogue of examples) {
      const dialogueIndex = i++

      const dialogueMessages = []

      let j = 0
      for (const example of dialogue) {
        const promptIndex = j++
        const identifier = `dialogueExamples ${dialogueIndex}-${promptIndex}`
        dialogueMessages.push(
          await PromptMessage.fromContent(identifier, example.role, example.content),
        )
      }

      if (!context.canAffordAll([newExampleChat, ...dialogueMessages])) {
        break
      }

      context.insertMessage(newExampleChat, 'dialogueExamples')
      for (const dialogueMessage of dialogueMessages) {
        context.insertMessage(dialogueMessage, 'dialogueExamples')
      }
    }
  }

  if (emBehavior.pinExample) {
    await populateDialogueExamples()
    await populateChatHistory()
  } else {
    await populateChatHistory()
    await populateDialogueExamples()
  }

  context.freeBudget(controlPrompts)
  if (!controlPrompts.isEmpty()) {
    context.insertCollection(controlPrompts)
  }

  return {
    promptCollection: context.collection,
    messages: context.getModelMessages(),
  }
}
