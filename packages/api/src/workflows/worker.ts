import { pathToFileURL } from 'node:url'
import { Worker } from '@temporalio/worker'

import { env } from '../env'
import * as deploymentActivities from './deployments/activities'
import * as functionActivities from './functions/activities'
import * as ruleActivities from './rules/activities'
import * as siteActivities from './sites/activities'

export async function createWorker() {
  return Worker.create({
    workflowsPath: new URL('./index.ts', import.meta.url).pathname,
    activities: {
      ...functionActivities,
      ...siteActivities,
      ...deploymentActivities,
      ...ruleActivities,
    },
    namespace: env.TEMPORAL_NAMESPACE,
    taskQueue: env.TEMPORAL_TASK_QUEUE,
  })
}

export async function runWorker() {
  const worker = await createWorker()
  await worker.run()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runWorker()
}
