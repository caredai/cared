const MAX_INJECTION_DEPTH = 10000

export class DepthManager {
  depths = new Set<number>()

  add(...depths: number[]): void {
    for (const depth of depths) {
      this.depths.add(depth)
    }
  }

  merge(depths: Set<number>) {
    for (const depth of depths) {
      this.depths.add(depth)
    }
  }

  values() {
    return Array.from(this.depths)
      .sort((a, b) => a - b)
      .slice(0, MAX_INJECTION_DEPTH)
  }
}
