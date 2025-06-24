declare module 'droll' {
  interface DrollResult {
    rolls: number[]
    modifier: number
    total: number
  }

  function validate(formula: string): boolean

  function roll(formula: string): DrollResult | false
}
