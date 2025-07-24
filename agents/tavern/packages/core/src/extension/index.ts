export enum ExtensionInjectionPosition {
  NONE = -1,
  IN_PROMPT = 0, // after `main` prompt
  IN_CHAT = 1, // in the chat history, at depth
  BEFORE_PROMPT = 2, // before `main` prompt
}

export function getExtensionPosition(p?: ExtensionInjectionPosition) {
  switch (p) {
    case ExtensionInjectionPosition.BEFORE_PROMPT:
      return 'start'
    case ExtensionInjectionPosition.IN_PROMPT:
      return 'end'
    default:
      return false
  }
}

export interface ExtensionPrompt {
  name: string
  value: string
  position: ExtensionInjectionPosition
  depth?: number // for IN_CHAT position, the depth in the chat history
  role: 'system' | 'user' | 'assistant'
}

export class ExtensionPromptManager {
  prompts = new Map<string, ExtensionPrompt>()
  depths = new Set<number>()

  add(prompt: ExtensionPrompt): void {
    if (this.prompts.has(prompt.name)) {
      throw new Error(`Extension prompt with name "${prompt.name}" already exists`)
    }
    this.prompts.set(prompt.name, prompt)
    if (prompt.depth !== undefined) {
      this.depths.add(prompt.depth)
    }
  }

  get(name: string) {
    return this.prompts.get(name)
  }

  prompt(
    position: ExtensionInjectionPosition,
    depth?: number,
    role: 'system' | 'user' | 'assistant' = 'system',
    separator = '\n',
  ) {
    return Array.from(this.prompts.values())
      .filter(
        (p) =>
          p.role === role &&
          p.position === position &&
          (position !== ExtensionInjectionPosition.IN_CHAT || p.depth === depth),
      )
      .map((p) => p.value.trim())
      .join(separator)
  }
}
