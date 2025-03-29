import type { UseChatHelpers } from 'ai/react'
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from 'react'

import type { ArtifactSuggestion } from '@ownxai/db/schema'

import type { UIArtifact } from './artifact'
import type { DataStreamDelta } from './data-stream-handler'

export interface ArtifactActionContext<M = any> {
  content: string
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void
  currentVersionIndex: number
  isCurrentVersion: boolean
  mode: 'edit' | 'diff'
  metadata: M
  setMetadata: Dispatch<SetStateAction<M>>
}

interface ArtifactAction<M = any> {
  icon: ReactNode
  label?: string
  description: string
  onClick: (context: ArtifactActionContext<M>) => Promise<void> | void
  isDisabled?: (context: ArtifactActionContext<M>) => boolean
}

export interface ArtifactToolbarContext {
  appendMessage: UseChatHelpers['append']
}

export interface ArtifactToolbarItem {
  description: string
  icon: ReactNode
  onClick: (context: ArtifactToolbarContext) => void
}

interface ArtifactContent<M = any> {
  artifactId: string
  title: string
  content: string
  mode: 'edit' | 'diff'
  isCurrentVersion: boolean
  currentVersionIndex: number
  status: 'streaming' | 'idle'
  suggestions: ArtifactSuggestion[]
  onSaveContent: (updatedContent: string, debounce: boolean) => void
  isInline: boolean
  getArtifactContentById: (index: number) => string
  isLoading: boolean
  metadata: M
  setMetadata: Dispatch<SetStateAction<M>>
}

interface InitializeParameters<M = any> {
  artifactId: string
  setMetadata: Dispatch<SetStateAction<M>>
}

interface ArtifactConfig<T extends string, M = any> {
  kind: T
  description: string
  content: ComponentType<ArtifactContent<M>>
  actions: ArtifactAction<M>[]
  toolbar: ArtifactToolbarItem[]
  initialize?: (parameters: InitializeParameters<M>) => void
  onStreamPart: (args: {
    setMetadata: Dispatch<SetStateAction<M>>
    setArtifact: Dispatch<SetStateAction<UIArtifact>>
    streamPart: DataStreamDelta
  }) => void
}

export class Artifact<T extends string, M = any> {
  readonly kind: T
  readonly description: string
  readonly content: ComponentType<ArtifactContent<M>>
  readonly actions: ArtifactAction<M>[]
  readonly toolbar: ArtifactToolbarItem[]
  readonly initialize?: (parameters: InitializeParameters) => void
  readonly onStreamPart: (args: {
    setMetadata: Dispatch<SetStateAction<M>>
    setArtifact: Dispatch<SetStateAction<UIArtifact>>
    streamPart: DataStreamDelta
  }) => void

  constructor(config: ArtifactConfig<T, M>) {
    this.kind = config.kind
    this.description = config.description
    this.content = config.content
    this.actions = config.actions
    this.toolbar = config.toolbar
    this.initialize = config.initialize ?? (() => ({}))
    this.onStreamPart = config.onStreamPart
  }
}
