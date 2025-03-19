const IV_LENGTH = 12 // For AES-GCM, this is always 12

// Alternatively: openssl rand -hex 32
export function keyGen() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')
}

/**
 * Encrypts the given plain text using AES-256-GCM algorithm.
 *
 * @param {string} encryptionKey - The encryption key in hex format.
 * @param {string} plainText - The text to encrypt.
 * @returns {string} The encrypted data in hex format, including IV.
 */
export async function encrypt(encryptionKey: string, plainText: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    Buffer.from(encryptionKey, 'hex'),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH)) // Directly use Buffer returned by randomBytes
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    new TextEncoder().encode(plainText),
  )

  // Return iv, encrypted data, combined in one line
  return Buffer.from(iv).toString('hex') + ':' + Buffer.from(encrypted).toString('hex')
}

export async function decrypt(encryptionKey: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    Buffer.from(encryptionKey, 'hex'),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )

  const [ivHex, encryptedHex] = text.split(':')
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid or corrupted cipher format')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const encryptedText = Buffer.from(encryptedHex, 'hex')

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encryptedText,
  )

  return new TextDecoder().decode(decryptedBuffer)
}
