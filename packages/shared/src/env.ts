export function runtimeEnv() {
  return Object.assign(
    {},
    process.env,
    import.meta.env,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    !process.env?.NODE_ENV
      ? // eslint-disable-next-line turbo/no-undeclared-env-vars,@typescript-eslint/no-unnecessary-condition
        import.meta.env?.PROD && {
          NODE_ENV: 'production',
        }
      : {
          NODE_ENV: process.env.NODE_ENV,
        },
  )
}
