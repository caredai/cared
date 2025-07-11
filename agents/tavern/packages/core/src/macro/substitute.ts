import type { ModelInfo } from '@ownxai/sdk'

import type { CharacterCardV2 } from '../character'
import type { CharGroupMetadata } from '../character-group'
import type { MessageNode } from '../message'
import type { ModelPreset } from '../model-preset'
import type { Settings } from '../settings'
import type { ReducedCharacter, ReducedChat, ReducedGroup, ReducedPersona } from '../types'
import type { Environment } from './macro'
import { GroupGenerationMode } from '../character-group'
import { parseDialogueExamples } from '../prompt'
import { evaluateMacros as _evaluateMacros } from './macro'
import { collapseNewlines } from './utils'

export interface SubstituteMacrosParams {
  messages?: MessageNode[]
  chat?: ReducedChat
  settings: Settings
  modelPreset: ModelPreset
  model?: ModelInfo
  persona?: ReducedPersona
  character?: CharacterCardV2 // next character
  group?: ReducedGroup
}

export function substituteMacros(
  {
    messages,
    chat,
    settings,
    modelPreset,
    model,
    persona,
    character,
    group,
  }: SubstituteMacrosParams,
  postProcessFn?: (s: string) => string,
) {
  const chatVariables = {
    ...(chat?.metadata.custom as any)?.variables,
  }
  const globalVariables = {
    ...settings.variables,
  }

  function buildCharVariables(character?: CharacterCardV2, group?: ReducedGroup) {
    return {
      user: persona?.name,
      char: character?.data.name,
      group: getGroupValue(character, group, true),
      charIfNotGroup: getGroupValue(character, group, true),
      groupNotMuted: getGroupValue(character, group, false),
    }
  }

  const envFromChar = {
    charPrompt: '',
    charInstruction: '',
    charJailbreak: '',
    description: '',
    personality: '',
    scenario: '',
    persona: '',
    mesExamples: '',
    mesExamplesRaw: '',
    charVersion: '',
    char_version: '',
  }

  const baseEnv = {
    ...envFromChar,

    original: '',

    model: model?.name,

    input: '',

    chat,
    messages,
    modelPreset,
    modelInfo: model,

    chatVariables,
    globalVariables,
  }

  const env: Environment = {
    ...baseEnv,
    ...buildCharVariables(character, group),
  }

  const evaluateBasicMacros = (content?: string, customEnv?: Environment) => {
    if (!content) {
      return ''
    }
    content = _evaluateMacros(content, (customEnv ?? env) as any, postProcessFn)

    if (settings.miscellaneous.collapseNewlines) {
      content = collapseNewlines(content)
    }

    // Always remove \r characters
    return content.replace(/\r/g, '')
  }

  // TODO: chat scenario
  const chatScenario = ''

  envFromChar.persona = evaluateBasicMacros(persona?.metadata.description)
  envFromChar.description = evaluateBasicMacros(character?.data.description)
  envFromChar.personality = evaluateBasicMacros(character?.data.personality)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  envFromChar.scenario = chatScenario || evaluateBasicMacros(character?.data.scenario)
  envFromChar.mesExamplesRaw = evaluateBasicMacros(character?.data.mes_example)
  envFromChar.mesExamples = parseDialogueExamples(envFromChar.mesExamplesRaw).join('')
  envFromChar.charPrompt = settings.miscellaneous.preferCharacterPrompt
    ? evaluateBasicMacros(character?.data.system_prompt, {
        ...env,
        original: modelPreset.prompts.find((p) => p.identifier === 'main')?.content ?? '',
      })
    : ''
  envFromChar.charInstruction = envFromChar.charJailbreak = settings.miscellaneous
    .preferCharacterJailbreak
    ? evaluateBasicMacros(character?.data.post_history_instructions, {
        ...env,
        original: modelPreset.prompts.find((p) => p.identifier === 'jailbreak')?.content ?? '',
      })
    : ''
  envFromChar.charVersion = envFromChar.char_version = character?.data.character_version ?? ''
  if (
    group?.metadata.generationMode === GroupGenerationMode.Append ||
    group?.metadata.generationMode === GroupGenerationMode.AppendDisabled
  ) {
    function customEvaluateBasicMacros(
      content: string | undefined,
      fieldName: string,
      character: CharacterCardV2,
    ) {
      content = content?.trim()
      if (!content) {
        return ''
      }
      // We should do the custom field name replacement first, and then run it through the normal macro engine with provided names
      content = content.replace(/<FIELDNAME>/gi, fieldName)
      return evaluateBasicMacros(content, {
        ...baseEnv,
        ...buildCharVariables(character, group),
      })
    }

    function replaceAndPrepareForJoin(
      content: string,
      fieldName: string,
      character: CharacterCardV2,
      preprocess?: (s: string) => string,
    ) {
      content = content.trim()
      if (!content) {
        return ''
      }

      if (preprocess) {
        content = preprocess(content)
      }

      const prefix = customEvaluateBasicMacros(
        group?.metadata.generationModePrefix,
        fieldName,
        character,
      )
      const suffix = customEvaluateBasicMacros(
        group?.metadata.generationModeSuffix,
        fieldName,
        character,
      )
      content = customEvaluateBasicMacros(content, fieldName, character)
      return prefix + content + suffix
    }

    const descriptions = []
    const personalities = []
    const scenarios = []
    const mesExamplesArray = []
    for (const char of group.characters) {
      if (
        group.metadata.disabledCharacters?.find((id) => char.id === id) &&
        group.metadata.generationMode !== GroupGenerationMode.AppendDisabled
      ) {
        console.debug(`Skipping disabled group member: ${char.content.data.name}`)
        continue
      }

      const charData = char.content.data
      descriptions.push(replaceAndPrepareForJoin(charData.description, 'Description', char.content))
      personalities.push(
        replaceAndPrepareForJoin(charData.personality, 'Personality', char.content),
      )
      scenarios.push(replaceAndPrepareForJoin(charData.scenario, 'Scenario', char.content))
      mesExamplesArray.push(
        replaceAndPrepareForJoin(charData.mes_example, 'Example Messages', char.content, (s) =>
          parseDialogueExamples(s).join(''),
        ),
      )
    }

    envFromChar.description = descriptions.filter((x) => x.length).join('\n')
    envFromChar.personality = personalities.filter((x) => x.length).join('\n')
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    envFromChar.scenario = chatScenario || scenarios.filter((x) => x.length).join('\n')
    envFromChar.mesExamples = mesExamplesArray.filter((x) => x.length).join('\n')
  }

  const evaluateMacros = (content: string) =>
    _evaluateMacros(
      content,
      {
        ...env,
        ...envFromChar,
      } as any,
      postProcessFn,
    )

  return {
    evaluateMacros,
  }
}

function getGroupValue(
  character?: CharacterCardV2,
  group?: {
    characters: ReducedCharacter[]
    metadata: CharGroupMetadata
  },
  includeMuted?: boolean,
) {
  if (!group) {
    return character?.data.name
  }

  const including = (x: string) =>
    includeMuted ? true : !group.metadata.disabledCharacters?.includes(x)
  return group.characters
    .filter((c) => including(c.id))
    .map((c) => c.content.data.name)
    .join(', ')
}
