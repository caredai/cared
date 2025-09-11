export async function register() {
  if (
    // eslint-disable-next-line no-restricted-properties
    process.env.NODE_ENV === 'development' &&
    // eslint-disable-next-line no-restricted-properties
    process.env.NEXT_RUNTIME === 'nodejs' &&
    typeof window === 'undefined'
  ) {
    await import('@/lib/proxy')
  }

  // eslint-disable-next-line no-restricted-properties
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node')
  }
}
