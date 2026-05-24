import { ACCESS_TIME_KEY, getRedis } from '../redis.js'

export function getMinutesSinceEpoch() {
  return Math.floor(Date.now() / 1000 / 60)
}

/** Records last access for a branch gateway (used by the offloader). */
export async function touchBranchAccess(branchKey: string) {
  const redis = await getRedis()
  await redis.zAdd(ACCESS_TIME_KEY, {
    score: getMinutesSinceEpoch(),
    value: branchKey,
  })
}
