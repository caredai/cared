/**
 * Merge two objects without undefined values from source
 * @param target The target object that contains part of T's properties
 * @param source The source object that contains the remaining properties of T
 * @returns Merged object that satisfies type T
 */
export function mergeWithoutUndefined<T extends Record<string, unknown>>(
  target: Partial<T>,
  source?: Partial<T>,
): T {
  if (!source) {
    return target as T
  }

  const result = { ...target }
  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined) {
      // @ts-ignore
      result[key] = value
    }
  })
  return result as T
}

/**
 * Instantiates a regular expression from a string.
 * @copyright Originally from: https://github.com/IonicaBizau/regex-parser.js/blob/master/lib/index.js
 */
export function regexFromString(input: string) {
  try {
    // Parse input
    const m = /(\/?)(.+)\1([a-z]*)/i.exec(input)
    if (!m) {
      return
    }

    // Invalid flags
    if (m[3] && !/^(?!.*?(.).*?\1)[gmixXsuUAJ]+$/.test(m[3])) {
      return RegExp(input)
    }

    // Create the regular expression
    return new RegExp(m[2]!, m[3])
  } catch {
    return
  }
}
