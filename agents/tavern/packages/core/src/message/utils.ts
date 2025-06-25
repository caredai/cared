/**
 * Replaces consecutive newlines with a single newline.
 * @example
 * collapseNewlines("\n\n\n"); // "\n"
 */
export function collapseNewlines(x: string) {
  return x.replaceAll(/\n+/g, '\n')
}
