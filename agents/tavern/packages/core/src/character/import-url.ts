import { Buffer } from 'node:buffer'
import { CCardLib } from '@risuai/ccardlib'
import sanitize from 'sanitize-filename'

import { env } from './env'
import { pngWrite } from './png-chunks'

export interface ImportUrlResult {
  type: 'character' | 'lorebook'
  bytes: Uint8Array
  filename: string
  mimeType?: string
}

export async function importUrl(url: string): ImportUrlResult | undefined {
  const host = new URL(url).host

  const isChub = host.includes('chub.ai') || host.includes('characterhub.org')
  const isJannnyContent = host.includes('janitorai')
  const isPygmalionContent = host.includes('pygmalion.chat')
  const isAICharacterCardsContent = host.includes('aicharactercards.com')
  const isRisu = host.includes('realm.risuai.net')
  const isGeneric = env.WHITELIST_IMPORT_DOMAINS.includes(host)

  if (isPygmalionContent) {
    const uuid = getUuidFromUrl(url)
    if (!uuid) {
      return
    }
    return await downloadPygmalionCharacter(uuid)
  } else if (isJannnyContent) {
    const uuid = getUuidFromUrl(url)
    if (!uuid) {
      return
    }
    return await downloadJannyCharacter(uuid)
  } else if (isAICharacterCardsContent) {
    const aicc = parseAICC(url);
    if (!aicc) {
      return
    }
    return await downloadAICCCharacter(aicc)
  } else if (isChub) {
  }
}

async function downloadPygmalionCharacter(id: string): Promise<ImportUrlResult | undefined> {
  const result = await fetch(`https://server.pygmalion.chat/api/export/character/${id}/v2`)
  if (!result.ok) {
    return
  }
  const charData = (await result.json()) as any
  const version = CCardLib.character.check(charData)
  if (version === 'unknown') {
    return
  }
  const avatarUrl = charData?.data?.avatar
  if (!avatarUrl?.endsWith('.png')) {
    return
  }
  const avatarResult = await fetch(avatarUrl)
  const bytes = pngWrite(await (await avatarResult.blob()).bytes(), JSON.stringify(charData))
  return {
    type: 'character',
    bytes,
    filename: `${sanitize(id)}.png`,
    mimeType: 'image/png',
  }
}

async function downloadJannyCharacter(uuid: string): Promise<ImportUrlResult | undefined> {
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
    return
  }
  const data = (await result.json()) as any
  if (data.status !== 'ok' || !data.downloadUrl.endsWith('.png')) {
    return
  }
  const imageResult = await fetch(data.downloadUrl)
  const bytes = await (await imageResult.blob()).bytes()
  return {
    type: 'character',
    bytes,
    filename: `${sanitize(uuid)}.png`,
    mimeType: 'image/png',
  }
}

async function downloadAICCCharacter(id: string): Promise<ImportUrlResult | undefined> {
  const apiURL = `https://aicharactercards.com/wp-json/pngapi/v1/image/${id}`;
  const response = await fetch(apiURL);
  if (!response.ok) {
    return
  }
  const bytes = await (await response.blob()).bytes()
  return {
    type: 'character',
    bytes,
    filename: `${sanitize(id)}.png`,
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

function parseChubUrl(str: string) {
  const splitStr = str.split('/');
  const length = splitStr.length;

  if (length < 2) {
    return
  }

  let domainIndex = -1;

  splitStr.forEach((part, index) => {
    if (part === 'www.chub.ai' || part === 'chub.ai' || part === 'www.characterhub.org' || part === 'characterhub.org') {
      domainIndex = index;
    }
  });

  const lastTwo = domainIndex !== -1 ? splitStr.slice(domainIndex + 1) : splitStr;

  const firstPart = lastTwo[0].toLowerCase();

  if (firstPart === 'characters' || firstPart === 'lorebooks') {
    const type = firstPart === 'characters' ? 'character' : 'lorebook';
    const id = type === 'character' ? lastTwo.slice(1).join('/') : lastTwo.join('/');
    return {
      id: id,
      type: type,
    };
  } else if (length === 2) {
    return {
      id: lastTwo.join('/'),
      type: 'character',
    };
  }

  return
}

