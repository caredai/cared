import type { FC } from 'react'
import React from 'react'
import type { CodeNodeType } from './types'
import type { NodeProps } from '@/types'

const Node: FC<NodeProps<CodeNodeType>> = () => {
  return (
    // No summary content
    <div></div>
  )
}

export default React.memo(Node)
