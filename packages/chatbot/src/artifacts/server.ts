import { addArtifactHandlers } from '@ownxai/tools'

import { codeArtifactHandler } from '@/artifacts/code/server'
import { imageArtifactHandler } from '@/artifacts/image/server'
import { sheetArtifactHandler } from '@/artifacts/sheet/server'
import { textArtifactHandler } from '@/artifacts/text/server'

addArtifactHandlers(
  textArtifactHandler,
  imageArtifactHandler,
  sheetArtifactHandler,
  codeArtifactHandler,
)
