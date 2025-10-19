import { Buffer, INSPECT_MAX_BYTES } from 'buffer'

export { LRUCache } from 'lru-cache'

// https://github.com/isaacs/node-lru-cache/issues/358#issue-2612104848
export function lruCacheSizeCalculation(value: any, key: string) {
  let sum = 0
  const keySize = Buffer.byteLength(key, 'utf8')

  const valSize =
    typeof value === 'string'
      ? Buffer.byteLength(value, 'utf8')
      : Buffer.byteLength(JSON.stringify(value), 'utf-8')

  // calc KeysMap key + index(int)
  sum += keySize + INT_SIZE_BYTES
  // calc keyList key size
  sum += keySize
  // calc valList val size
  sum += valSize

  // calc ttl start + ttl
  // next arr
  sum += INT_SIZE_BYTES
  // prev arr
  sum += INSPECT_MAX_BYTES

  // size of the size itself
  sum += INT_SIZE_BYTES

  // ttl start arr
  sum += INT_SIZE_BYTES

  return Math.floor(sum * 1.5)
}

const INT_SIZE_BYTES = 64
