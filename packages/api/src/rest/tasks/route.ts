import type { NextRequest } from 'next/server'
import { notFound } from 'next/navigation'

import * as processDocument from './processDocument'

export const POST = async (req: NextRequest, props: { params: { tasks: string[] } }) => {
  switch (props.params.tasks[0]) {
    case processDocument.name:
      return processDocument.POST(req)
    default:
      notFound()
  }
}

export const taskTrigger = {
  processDocument: processDocument.trigger,
}
