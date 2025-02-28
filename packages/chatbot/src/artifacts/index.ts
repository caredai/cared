import { addArtifactHandlers } from '@mindworld/tools'

import { codeArtifactHandler } from './code/server'
import { imageArtifactHandler } from './image/server'
import { sheetArtifactHandler } from './sheet/server'
import { textArtifactHandler } from './text/server'

addArtifactHandlers(
  textArtifactHandler,
  imageArtifactHandler,
  sheetArtifactHandler,
  codeArtifactHandler,
)
