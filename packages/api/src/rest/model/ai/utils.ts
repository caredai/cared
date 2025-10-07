import type { HonoRequest } from 'hono'

import { SuperJSON } from '@cared/shared'

export async function requestJson(request: HonoRequest): Promise<object> {
  return SuperJSON.deserialize(await request.json())
}

export function makeResponseJson<JsonBody>(body: JsonBody, init?: ResponseInit): Response {
  return Response.json(SuperJSON.serialize(body), init)
}
