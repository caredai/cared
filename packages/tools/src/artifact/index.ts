import { createArtifact } from './create-artifact'
import { requestSuggestions } from './request-suggestions'
import { updateArtifact } from './update-artifact'

export * from './server'

export const artifactTools = {
  createArtifact,
  updateArtifact,
  requestSuggestions,
}
