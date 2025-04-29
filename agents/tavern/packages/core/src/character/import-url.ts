import { CCardLib } from '@risuai/ccardlib'
import sanitize from 'sanitize-filename'

import { env } from '../env'
import { pngWrite } from './png-chunks'

export interface ImportUrlResult {
  type: 'character' | 'lorebook'
  bytes: Uint8Array
  filename: string
  mimeType: string
}

export async function importUrl(url: string): Promise<ImportUrlResult | string> {
  if (!URL.canParse(url)) {
    return await importUuid(url)
  }

  const host = new URL(url).host

  const isChub = host.includes('chub.ai') || host.includes('characterhub.org')
  const isJannnyContent = host.includes('janitorai')
  const isPygmalionContent = host.includes('pygmalion.chat')
  const isAICharacterCardsContent = host.includes('aicharactercards.com')
  const isRisu = host.includes('realm.risuai.net')
  const isGeneric = env.NEXT_PUBLIC_WHITELIST_IMPORT_DOMAINS.includes(host)

  if (isPygmalionContent) {
    const uuid = getUuidFromUrl(url)
    if (!uuid) {
      return 'invalid Pygmalion URL'
    }
    return await downloadPygmalionCharacter(uuid)
  } else if (isJannnyContent) {
    const uuid = getUuidFromUrl(url)
    if (!uuid) {
      return 'invalid Janny URL'
    }
    return await downloadJannyCharacter(uuid)
  } else if (isAICharacterCardsContent) {
    const aicc = parseAICC(url)
    if (!aicc) {
      return 'invalid AICC URL'
    }
    return await downloadAICCCharacter(aicc)
  } else if (isChub) {
    const { id, type } = parseChubUrl(url) ?? {}
    if (!id || !type) {
      return 'invalid Chub URL'
    }
    if (type === 'character') {
      return await downloadChubCharacter(id)
    } else {
      return await downloadChubLorebook(id)
    }
  } else if (isRisu) {
    const uuid = parseRisuUrl(url)
    if (!uuid) {
      return 'invalid RisuRealm URL'
    }
    return await downloadRisuCharacter(uuid)
  } else if (isGeneric) {
    return await downloadGenericPng(url)
  }

  return 'unsupported URL'
}

async function importUuid(uuid: string): Promise<ImportUrlResult | string> {
  const isJannny = uuid.includes('_character')
  const isPygmalion = !isJannny && uuid.length == 36
  const isAICC = uuid.startsWith('AICC/')
  const uuidType = uuid.includes('lorebook') ? 'lorebook' : 'character'

  if (isPygmalion) {
    return await downloadPygmalionCharacter(uuid)
  } else if (isJannny) {
    uuid = uuid.split('_')[0] ?? ''
    if (!uuid) {
      return 'invalid Janny UUID'
    }
    return await downloadJannyCharacter(uuid)
  } else if (isAICC) {
    const [, author, card] = uuid.split('/')
    return await downloadAICCCharacter(`${author}/${card}`)
  } else {
    if (uuidType === 'character') {
      return await downloadChubCharacter(uuid)
    } else {
      return await downloadChubLorebook(uuid)
    }
  }
}

async function downloadPygmalionCharacter(id: string): Promise<ImportUrlResult | string> {
  const result = await fetch(`https://server.pygmalion.chat/api/export/character/${id}/v2`)
  if (!result.ok) {
    return `failed to fetch Pygmalion character: ${result.statusText}`
  }
  const charData = (await result.json()) as any
  const version = CCardLib.character.check(charData)
  if (version === 'unknown') {
    return `failed to parse Pygmalion character json`
  }
  const avatarUrl = charData?.data?.avatar as string | undefined
  if (!avatarUrl?.endsWith('.png')) {
    return `no avatar found in Pygmalion character`
  }
  const avatarResult = await fetch(avatarUrl)
  if (!avatarResult.ok) {
    return `failed to fetch Pygmalion character avatar: ${avatarResult.statusText}`
  }
  const bytes = pngWrite(await getBytes(avatarResult), JSON.stringify(charData))
  return {
    type: 'character',
    bytes,
    filename: `${sanitize(id)}.png`,
    mimeType: 'image/png',
  }
}

async function downloadJannyCharacter(uuid: string): Promise<ImportUrlResult | string> {
  // This endpoint is being guarded behind Bot Fight Mode of Cloudflare
  // Should work normally on client frontend
  const result = await fetch('https://api.jannyai.com/api/v1/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      characterId: uuid,
    }),
  })
  if (!result.ok) {
    return `failed to fetch Janny character: ${result.statusText}`
  }
  const data = (await result.json()) as any
  if (data.status !== 'ok' || !data.downloadUrl.endsWith('.png')) {
    return `failed to parse Janny character json`
  }
  const imageResult = await fetch(data.downloadUrl)
  if (!imageResult.ok) {
    return `failed to fetch Janny character image: ${imageResult.statusText}`
  }
  const bytes = await getBytes(imageResult)
  return {
    type: 'character',
    bytes,
    filename: `${sanitize(uuid)}.png`,
    mimeType: 'image/png',
  }
}

async function downloadAICCCharacter(id: string): Promise<ImportUrlResult | string> {
  const apiURL = `https://aicharactercards.com/wp-json/pngapi/v1/image/${id}`
  const response = await fetch(apiURL)
  if (!response.ok || response.headers.get('Content-Type') !== 'image/png') {
    return `failed to fetch AICC character: ${response.statusText}`
  }
  const bytes = await getBytes(response)
  return {
    type: 'character',
    bytes,
    filename: `${sanitize(id)}.png`,
    mimeType: 'image/png',
  }
}

async function downloadChubCharacter(id: string): Promise<ImportUrlResult | string> {
  const response = await fetch('https://api.chub.ai/api/characters/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      format: 'tavern',
      fullPath: id,
    }),
  })

  if (!response.ok || response.headers.get('Content-Type') !== 'image/png') {
    return `failed to fetch Chub character: ${response.statusText}`
  }

  const name = id.split('/').pop() ?? ''
  const bytes = new Uint8Array(await response.arrayBuffer())
  return {
    type: 'character',
    bytes,
    filename: `${sanitize(name)}.png`,
    mimeType: 'image/png',
  }
}

async function downloadChubLorebook(id: string): Promise<ImportUrlResult | string> {
  const response = await fetch('https://api.chub.ai/api/lorebooks/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullPath: id,
      format: 'SILLYTAVERN',
    }),
  })
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
    return `failed to fetch Chub lorebook: ${response.statusText}`
  }

  const name = id.split('/').pop() ?? ''
  const bytes = await getBytes(response)
  return {
    type: 'lorebook',
    bytes,
    filename: `${sanitize(name)}.json`,
    mimeType: 'application/json',
  }
}

async function downloadRisuCharacter(uuid: string): Promise<ImportUrlResult | string> {
  const response = await fetch(
    `https://realm.risuai.net/api/v1/download/png-v3/${uuid}?non_commercial=true`,
  )
  if (!response.ok || response.headers.get('Content-Type') !== 'image/png') {
    return `failed to fetch RisuRealm character: ${response.statusText}`
  }

  const bytes = await getBytes(response)
  return {
    type: 'character',
    bytes,
    filename: `${sanitize(uuid)}.png`,
    mimeType: 'image/png',
  }
}

async function downloadGenericPng(url: string): Promise<ImportUrlResult | string> {
  const response = await fetch(url)
  if (!response.ok || response.headers.get('Content-Type') !== 'image/png') {
    return `failed to fetch image: ${response.statusText}`
  }

  const filename = sanitize(response.url.split('?')[0]?.split('/').reverse()[0] ?? '')
  const bytes = await getBytes(response)
  return {
    type: 'character',
    bytes,
    filename: filename.endsWith('.png') ? filename : `${filename}.png`,
    mimeType: 'image/png',
  }
}

function getUuidFromUrl(url: string) {
  const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
  const matches = uuidRegex.exec(url)
  return matches ? matches[0] : undefined
}

function parseAICC(url: string) {
  const pattern =
    /^https?:\/\/aicharactercards\.com\/character-cards\/([^/]+)\/([^/]+)\/?$|([^/]+)\/([^/]+)$/
  const match = pattern.exec(url)
  if (!match) {
    return
  }
  // Match group 1 & 2 for full URL, 3 & 4 for relative path
  return match[1] && match[2] ? `${match[1]}/${match[2]}` : `${match[3]}/${match[4]}`
}

function parseChubUrl(str: string):
  | {
      id: string
      type: 'character' | 'lorebook'
    }
  | undefined {
  const splitStr = str.split('/')
  const length = splitStr.length

  if (length < 2) {
    return
  }

  let domainIndex = -1

  splitStr.forEach((part, index) => {
    if (
      part === 'www.chub.ai' ||
      part === 'chub.ai' ||
      part === 'www.characterhub.org' ||
      part === 'characterhub.org'
    ) {
      domainIndex = index
    }
  })

  const lastTwo = domainIndex !== -1 ? splitStr.slice(domainIndex + 1) : splitStr

  const firstPart = lastTwo[0]?.toLowerCase()

  if (firstPart === 'characters' || firstPart === 'lorebooks') {
    const type = firstPart === 'characters' ? 'character' : 'lorebook'
    const id = type === 'character' ? lastTwo.slice(1).join('/') : lastTwo.join('/')
    return {
      id,
      type,
    }
  } else if (length === 2) {
    return {
      id: lastTwo.join('/'),
      type: 'character',
    }
  }
}

function parseRisuUrl(url: string) {
  // Example: https://realm.risuai.net/character/7adb0ed8d81855c820b3506980fb40f054ceef010ff0c4bab73730c0ebe92279
  // or https://realm.risuai.net/character/7adb0ed8-d818-55c8-20b3-506980fb40f0
  const pattern = /^https?:\/\/realm\.risuai\.net\/character\/([a-f0-9-]+)\/?$/i
  const match = pattern.exec(url)
  return match?.at(1)
}

async function getBytes(response: Response) {
  return new Uint8Array(await response.arrayBuffer())
}
