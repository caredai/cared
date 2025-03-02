import { codeArtifact } from './code/client'
import { imageArtifact } from './image/client'
import { sheetArtifact } from './sheet/client'
import { textArtifact } from './text/client'

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
]

export type ArtifactKind = (typeof artifactDefinitions)[number]['kind']
