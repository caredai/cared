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
    countTokens,
    log,
    substituteMacros,
    characterFields,
  } = params

  TokenCounter.setup((text: string) => countTokens(text, model.id))

  if (!modelPreset.maxContext) {
    return {}
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
    prompt: Prompt,
    content?: string,
  ) {
    const collection = new PromptCollection(prompt.identifier, prompt)
    collection.add(
      await PromptMessage.fromContent(
        prompt.identifier,
        prompt.role ?? 'system',
        substituteMacros(content ?? prompt.content ?? ''),
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
  // Absolute prompts will always be inserted into the chat history
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

  // Relative prompts will maintain their relative order in the final prompt sequence.
  // In other words, relative prompts determine the overall order of prompts,
  // while absolute prompts are actually inserted into specific positions within the relative prompts.
  for (const prompt of relativePrompts) {
    const collection = promptCollectionMap.get(prompt.identifier)
    if (collection) {
      context.insertCollection(collection)
    } else {
      // Actually, for `dialogueExamples` and `chatHistory`, process them later.
      context.insertCollection(new PromptCollection(prompt.identifier, prompt))
    }
  }

  function populateInjectionPrompts() {
    // Inject depth prompts into chat history, from bottom (depth 0) to top
    const reversedMessages: (ReducedMessage | InjectedMessage)[] =
      chatHistoryWithCharacterNames.reverse()

    let totalInsertedMessages = 0

    const depthManager = new DepthManager()
    depthManager.add(...absolutePrompts.map(([p]) => p.injection_depth ?? 0))
    depthManager.add(...(lorebook?.lorebookDepthEntries.map((item) => item.depth) ?? []))
    depthManager.merge(extensionPromptManager.depths)
    const roles = ['system', 'user', 'assistant'] as const
    for (const depth of depthManager.values()) {
      const depthPrompts = absolutePrompts.filter(
        ([p, c]) => p.enabled && p.injection_depth === depth && !c.isEmpty(),
      )

      const depthMessages: InjectedMessage[] = []
      for (const role of roles) {
        const prompt = depthPrompts
          .filter(([p]) => p.role === role)
          .map(([, c]) => c.getText())
          .join('\n')
        const lorePrompt =
          lorebook?.lorebookDepthEntries
            .filter((item) => item.role === role && item.depth === depth)
            .map((item) => item.entries.filter(Boolean).join('\n'))
            .filter(Boolean)
            .join('\n') ?? ''
        const extensionPrompt = extensionPromptManager.prompt(
          ExtensionInjectionPosition.IN_CHAT,
          depth,
          role,
        )
        const jointPrompt = [substituteMacros(prompt), lorePrompt, extensionPrompt]
          .filter(Boolean)
          .join('\n')
        if (jointPrompt.trim()) {
          depthMessages.push({
            role,
            content: jointPrompt,
          })
        }
      }

      if (depthMessages.length) {
        const injectIdx = depth + totalInsertedMessages
        reversedMessages.splice(injectIdx, 0, ...depthMessages)
        totalInsertedMessages += depthMessages.length
      }
    }

    return reversedMessages
  }

  const reversedMessages = populateInjectionPrompts()

  async function populateChatHistory() {
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
      const identifier = `chatHistory-${reversedMessages.length - i}${isInjectedMessage(msg) ? '-injected' : ''}`
      const chatMessage = isInjectedMessage(msg)
        ? await PromptMessage.fromContent(identifier, msg.role, msg.content)
        : await PromptMessage.fromMessage(identifier, msg)

      if (!context.canAfford(chatMessage)) {
        break
      }

      if (
        generateType === 'continue' &&
        modelPreset.continuePrefill &&
        !isInjectedMessage(msg) &&
        !metFirstNonInjected
      ) {
        // Only process the first non-injected message in the reversedMessages array
        // This ensures that the continue-prefill logic is applied only once
        metFirstNonInjected = true

        const continuePrefillCollection = new PromptCollection('continuePrefill')
        if (msg.role === 'assistant') {
          // Only the claude models from Anthropic support assistant prefill
          const supportsAssistantPrefill = model.id.startsWith('anthropic')
          const assistantPrefill = supportsAssistantPrefill
            ? substituteMacros(modelPreset.vendor?.claude?.assistantPrefill ?? '')
            : ''
          const continueMessage = structuredClone(msg)
          if (assistantPrefill) {
            // Prepend the assistant prefill to the continue message content
            continueMessage.content.parts.unshift({
              type: 'text',
              text: assistantPrefill,
            })
          }
          continuePrefillCollection.add(
            await PromptMessage.fromMessage(identifier, continueMessage),
          )
        } else {
          continuePrefillCollection.add(chatMessage)
        }

        // Insert the continue-prefill collection at the end of the prompt sequence
        context.insertCollection(continuePrefillCollection)

        continue
      }

      context.insertMessage(chatMessage, 'chatHistory', 'start')
    }

    context.freeBudget(newChatMessage)
    // Insert the new chat message at the start of the chat history
    context.insertMessage(newChatMessage, 'chatHistory', 'start')

    if (hasGroupNudge && groupNudgeMessage) {
      context.freeBudget(groupNudgeMessage)
      // Insert the group nudge message at the end of the chat history
      context.insertMessage(groupNudgeMessage, 'chatHistory')
    }

    if (generateType === 'continue' && continueMessageCollection) {
      context.freeBudget(continueMessageCollection)
      // Insert the continue message collection at the end of the prompt sequence
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

  // The reason why dialogue examples and chat history are populated at the end
  // is that, due to token budget constraints, their length may be too long and thus partially truncated.
  if (emBehavior.pinExample) {
    await populateDialogueExamples()
    await populateChatHistory()
  } else {
    await populateChatHistory()
    await populateDialogueExamples()
  }

  context.freeBudget(controlPrompts)
  if (!controlPrompts.isEmpty()) {
    // Always insert control prompts at the end
    context.insertCollection(controlPrompts)
  }

  if (log) {
    context.log()
  }

  return {
    promptCollections: context.collections,
    modelMessages: context.getModelMessages(),
    updatedTimedEffects: lorebook?.updatedTimedEffects,
  }
}

interface InjectedMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function isInjectedMessage(message: ReducedMessage | InjectedMessage): message is InjectedMessage {
  return typeof message.content === 'string'
}
