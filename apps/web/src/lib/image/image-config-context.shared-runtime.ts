import React from 'react'

import type { ImageConfigComplete } from './image-config'
import { env } from '@/env'
import { imageConfigDefault } from './image-config'

export const ImageConfigContext = React.createContext<ImageConfigComplete>(imageConfigDefault)

if (env.NODE_ENV !== 'production') {
  ImageConfigContext.displayName = 'ImageConfigContext'
}
