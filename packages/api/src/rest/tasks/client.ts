import * as path from 'path'
import { Client } from '@upstash/workflow'

import { env } from '../../env'

class WorkflowClient extends Client {
  override trigger(config: Parameters<Client['trigger']>[0]) {
    return super.trigger({
      ...config,
      url: new URL(
        path.posix.join(tasksApiRoutePath ?? '', config.url),
        env.UPSTASH_WORKFLOW_URL,
      ).toString(),
    })
  }
}

let client: WorkflowClient | undefined

export function getClient() {
  if (!client) {
    client = new WorkflowClient({})
  }

  return client
}

let tasksApiRoutePath: string | undefined

export function setRoutePath(path: string) {
  tasksApiRoutePath = path
}
