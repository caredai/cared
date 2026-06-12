import { Connection, WorkflowClient } from '@temporalio/client'

import { env } from '../env'

let clientPromise: Promise<WorkflowClient> | undefined

export function getWorkflowClient() {
  clientPromise ??= Connection.connect({
    address: env.TEMPORAL_ADDRESS,
  }).then(
    (connection) =>
      new WorkflowClient({
        connection,
        namespace: env.TEMPORAL_NAMESPACE,
      }),
  )

  return clientPromise
}

export function taskQueue() {
  return env.TEMPORAL_TASK_QUEUE
}

export function workflowId(parts: string[]) {
  return parts.join(':')
}
