import type { CharacterCardV3 } from '@risuai/ccardlib'
import mime from 'mime'
import sanitize from 'sanitize-filename'
import { unzip } from 'unzipit'

import { pngRead, pngWrite } from './png-chunks'
import { convertToV2 } from './types'

export interface ImportFileResult {
  bytes: Uint8Array
  filename: string
}

export async function importFile(
  file: File,
  defaultPngBytes: Uint8Array,
): Promise<ImportFileResult | string> {
  switch (mime.getExtension(file.type)) {
    case 'png':
      return await importPng(file)
    case 'json':
      return await importJson(file, defaultPngBytes)
    case 'charx':
      return await importCharx(file, defaultPngBytes)
    default:
      return `unsupported file type: ${mime.getExtension(file.type)}`
  }
}

async function importPng(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const card = JSON.parse(pngRead(bytes))
  const cardV2 = convertToV2(card)
  console.log('importPng:', {
    card,
    cardV2,
  })
  return {
    bytes,
    filename: file.name,
  }
}

async function importJson(file: File, defaultPngBytes: Uint8Array) {
  const data = await file.text()
  const _ = convertToV2(JSON.parse(data))

  return {
    bytes: pngWrite(defaultPngBytes, data),
    filename: file.name.replace('.json', '.png'),
  }
}

async function importCharx(file: File, defaultPngBytes: Uint8Array) {
  const entries = Object.entries((await unzip(file)).entries)

  const findEntry = (name: string) => entries.find(([key]) => key.endsWith(name))?.[1]

  const card = await findEntry('card.json')?.json()
  if (!card) {
    return 'charx zip file does not contain card.json'
  }

  const cardV2 = convertToV2(card)

  const filename = `${sanitize(cardV2.data.name)}.png`

  if (card.spec === 'chara_card_v3') {
    const assets = (card as CharacterCardV3).data.assets ?? []
    for (const asset of assets.filter((x) => x.type === 'icon' && x.ext === 'png')) {
      const pathNoProtocol = String(asset.uri.replace(/^(?:\/\/|[^/]+)*\//, ''))
      const avatar = await (await findEntry(pathNoProtocol)?.blob())?.bytes()
      if (avatar) {
        return {
          bytes: avatar,
          filename,
        }
      }
    }
  }

  return {
    bytes: pngWrite(defaultPngBytes, JSON.stringify(card)),
    filename,
  }
}
