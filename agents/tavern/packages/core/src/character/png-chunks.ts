import PNGtext from 'png-chunk-text'
import encode from 'png-chunks-encode'
import extract from 'png-chunks-extract'

/**
 * Writes Character metadata to a PNG image buffer.
 * Writes only 'chara', 'ccv3'.
 */
export function pngWrite(image: Uint8Array, data: string): Uint8Array {
  const chunks = extract(image)
  const tEXtChunks = chunks.filter((chunk) => chunk.name === 'tEXt')

  // Remove existing tEXt chunks
  for (const tEXtChunk of tEXtChunks) {
    const data = PNGtext.decode(tEXtChunk.data)
    if (data.keyword.toLowerCase() === 'chara' || data.keyword.toLowerCase() === 'ccv3') {
      chunks.splice(chunks.indexOf(tEXtChunk), 1)
    }
  }

  // Add new v2 chunk before the IEND chunk
  const base64EncodedData = Buffer.from(data, 'utf8').toString('base64')
  chunks.splice(-1, 0, PNGtext.encode('chara', base64EncodedData))

  // Try adding v3 chunk before the IEND chunk
  try {
    // Change v2 format to v3
    const v3Data = JSON.parse(data)
    v3Data.spec = 'chara_card_v3'
    v3Data.spec_version = '3.0'

    const base64EncodedData = Buffer.from(JSON.stringify(v3Data), 'utf8').toString('base64')
    chunks.splice(-1, 0, PNGtext.encode('ccv3', base64EncodedData))
  } catch {
    // Ignore errors when adding v3 chunk
  }

  return encode(chunks)
}

/**
 * Reads Character metadata from a PNG image buffer.
 * Supports both V2 (chara) and V3 (ccv3). V3 (ccv3) takes precedence.
 */
export function pngRead(image: Uint8Array): string {
  const chunks = extract(image)

  const textChunks = chunks
    .filter((chunk) => chunk.name === 'tEXt')
    .map((chunk) => PNGtext.decode(chunk.data))

  if (textChunks.length === 0) {
    throw new Error('No PNG metadata')
  }

  const ccv3Chunk = textChunks.find((chunk) => chunk.keyword.toLowerCase() === 'ccv3')

  if (ccv3Chunk) {
    return Buffer.from(ccv3Chunk.text, 'base64').toString('utf8')
  }

  const charaChunk = textChunks.find((chunk) => chunk.keyword.toLowerCase() === 'chara')

  if (charaChunk) {
    return Buffer.from(charaChunk.text, 'base64').toString('utf8')
  }

  throw new Error('No PNG metadata')
}

export async function pngParse(url: string, format?: 'png') {
  const fileFormat = format ?? 'png'

  switch (fileFormat) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case 'png': {
      const buffer = await (await fetch(url)).blob()
      return pngRead(await buffer.bytes())
    }
  }

  throw new Error('Unsupported format')
}
