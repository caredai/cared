/**
 * Measures the execution time of an async function
 * @param fn The async function to measure
 * @param unit The unit of time to return (minutes, seconds, or milliseconds)
 * @returns A tuple containing [result, executionTimeInSpecifiedUnit]
 */
export async function measure<T>(
  fn: (() => Promise<T>) | Promise<T>,
  unit: 'minutes' | 'seconds' | 'milliseconds' = 'seconds',
): Promise<[T, number]> {
  const startTime = performance.now()
  const result = typeof fn === 'function' ? await fn() : await fn
  const endTime = performance.now()
  const executionTimeMs = endTime - startTime

  // Convert execution time to the specified unit
  const executionTime = Math.floor(
    (() => {
      switch (unit) {
        case 'minutes':
          return executionTimeMs / (1000 * 60)
        case 'seconds':
          return executionTimeMs / 1000
        case 'milliseconds':
          return executionTimeMs
        default:
          return executionTimeMs / 1000
      }
    })(),
  )

  return [executionTime, result]
}
