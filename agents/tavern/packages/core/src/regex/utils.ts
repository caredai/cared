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
