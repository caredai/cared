/**
 * Extracts words from a string.
 * @example
 * extractAllWords('Hello, world!'); // ['hello', 'world']
 */
export function extractAllWords(value: string) {
  const words: string[] = []

  if (!value) {
    return words
  }

  const matches = value.matchAll(/\b\w+\b/gim)
  for (const match of matches) {
    words.push(match[0].toLowerCase())
  }
  return words
}
