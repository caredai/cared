export const DEFAULT_DEPTH = 4

export const INJECTION_POSITION = {
  RELATIVE: 0,
  ABSOLUTE: 1,
}

/**
 * Represents a prompt.
 */
export class Prompt {
  /**
   * Unique identifier for the prompt
   */
  public identifier: string

  /**
   * Role of the prompt (e.g. 'system', 'user', etc.)
   */
  public role: string

  /**
   * The actual content/text of the prompt
   */
  public content: string

  /**
   * Display name of the prompt
   */
  public name: string

  /**
   * Whether this is a system-level prompt
   */
  public system_prompt: boolean

  /**
   * Position of the prompt in the sequence
   */
  public position: string

  /**
   * Position where the prompt should be injected
   */
  public injection_position: number

  /**
   * Depth level for prompt injection
   */
  public injection_depth: number

  /**
   * Whether this prompt can be overridden
   */
  public forbid_overrides: boolean

  /**
   * Whether this prompt is added by an extension
   */
  public extension: boolean

  /**
   * Creates a new Prompt instance
   * @param params Configuration parameters for the prompt
   */
  constructor(params: {
    identifier: string
    role: string
    content: string
    name: string
    system_prompt: boolean
    position: string
    injection_position: number
    injection_depth: number
    forbid_overrides: boolean
    extension: boolean
  }) {
    this.identifier = params.identifier
    this.role = params.role
    this.content = params.content
    this.name = params.name
    this.system_prompt = params.system_prompt
    this.position = params.position
    this.injection_position = params.injection_position
    this.injection_depth = params.injection_depth
    this.forbid_overrides = params.forbid_overrides
    this.extension = params.extension
  }

  /**
   * Creates a copy of the current prompt
   * @returns A new Prompt instance with the same properties
   */
  public clone(): Prompt {
    return new Prompt({
      identifier: this.identifier,
      role: this.role,
      content: this.content,
      name: this.name,
      system_prompt: this.system_prompt,
      position: this.position,
      injection_position: this.injection_position,
      injection_depth: this.injection_depth,
      forbid_overrides: this.forbid_overrides,
      extension: this.extension,
    })
  }
}

/**
 * Manages a collection of prompts with functionality for adding, retrieving,
 * and manipulating prompts in the collection.
 */
export class PromptCollection {
  /**
   * Array of prompts in the collection
   */
  collection: Prompt[] = []

  /**
   * Array of overridden prompts
   */
  overriddenPrompts: string[] = []

  /**
   * Creates a new PromptCollection instance
   * @param prompts Initial prompts to add to the collection
   */
  constructor(...prompts: Prompt[]) {
    this.collection.push(...prompts)
  }

  /**
   * Adds one or more prompts to the collection
   * @param prompts Prompts to add
   */
  public add(...prompts: Prompt[]): void {
    this.collection.push(...prompts)
  }

  /**
   * Sets a prompt at a specific position in the collection
   * @param prompt Prompt to set
   * @param position Position to set the prompt at
   */
  public set(prompt: Prompt, position: number): void {
    if (position >= 0 && position < this.collection.length) {
      this.collection[position] = prompt
    } else {
      throw new Error('Position out of bounds')
    }
  }

  /**
   * Retrieves a prompt by its identifier
   * @param identifier Identifier of the prompt to retrieve
   * @returns The found prompt or undefined if not found
   */
  public get(identifier: string): Prompt | undefined {
    return this.collection.find((prompt) => prompt.identifier === identifier)
  }

  /**
   * Gets the index of a prompt in the collection
   * @param identifier Identifier of the prompt to find
   * @returns The index of the prompt or -1 if not found
   */
  public index(identifier: string): number {
    return this.collection.findIndex((prompt) => prompt.identifier === identifier)
  }

  /**
   * Checks if a prompt exists in the collection
   * @param identifier Identifier of the prompt to check
   * @returns True if the prompt exists, false otherwise
   */
  public has(identifier: string): boolean {
    return this.collection.some((prompt) => prompt.identifier === identifier)
  }

  /**
   * Overrides a prompt at a specific position
   * @param prompt Prompt to override with
   * @param position Position to override at
   */
  public override(prompt: Prompt, position: number): void {
    this.set(prompt, position)
    this.overriddenPrompts.push(prompt.identifier)
  }
}

export class PromptManager {
  systemPrompts = [
    'main',
    'nsfw',
    'jailbreak',
    'enhanceDefinitions',
  ]

  overridablePrompts = [
    'main',
    'jailbreak',
  ]

  overriddenPrompts = []

  configuration = {
    version: 1,
    toggleDisabled: [],
    promptOrder: {
      strategy: 'global',
      dummyId: 100000,
    },
    sortableDelay: 30,
    warningTokenThreshold: 1500,
    dangerTokenThreshold: 500,
    defaultPrompts: {
      main: '',
      nsfw: '',
      jailbreak: '',
      enhanceDefinitions: '',
    },
  }
}
