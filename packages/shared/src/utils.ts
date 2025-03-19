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
