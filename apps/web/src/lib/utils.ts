export function stripIdPrefix(id: string) {
  return id.split('_', 2)[1] ?? ''
}

export function addIdPrefix(id: string, prefix: string) {
  return `${prefix}_${id}`
}

// shorten the input string
export function shortenString(
  str?: string,
  opts?: {
    leadingChars?: number | string
    prefixChars?: number
    suffixChars?: number
  },
): string {
  if (!str) {
    return 'Not Available'
  }

  const { leadingChars: _leadingChars = 2, prefixChars = 3, suffixChars = 4 } = opts ?? {}

  const leadingChars = typeof _leadingChars === 'number' ? _leadingChars : _leadingChars.length

  if (str.length <= leadingChars + prefixChars + suffixChars) {
    return str
  }

  return `${str.substring(0, leadingChars + prefixChars)}...${str.substring(
    str.length - suffixChars,
  )}`
}
