import type { RegexScript } from './types'
import { RegexSubstituteMode } from './types'

/**
 * Runs the provided regex script on the given string.
 */
export function runRegexScript(
  regexScript: RegexScript,
  rawString: string,
  evaluateMacros: (content: string, postProcessFn?: (s: string) => string) => string,
) {
  let newString = rawString
  if (regexScript.disabled || !regexScript.regex || !rawString) {
    return newString
  }

  const getRegexString = () => {
    switch (regexScript.substituteMode) {
      case RegexSubstituteMode.NONE:
        return regexScript.regex
      case RegexSubstituteMode.RAW: {
        return evaluateMacros(regexScript.regex)
      }
      case RegexSubstituteMode.ESCAPED: {
        return evaluateMacros(regexScript.regex, sanitizeRegexMacro)
      }
      default:
        return regexScript.regex
    }
  }
  const regexString = getRegexString()
  const findRegex = regexFromString(regexString)
  console.log('findRegex:', findRegex)

  if (!findRegex) {
    return newString
  }

  // Run replacement. Currently does not support the Overlay strategy
  newString = rawString.replace(findRegex, function (...args) {
    const replaceString = regexScript.replaceString.replace(/{{match}}/gi, '$0')
    const replaceWithGroups = replaceString.replaceAll(/\$(\d+)/g, (_, num) => {
      // Get a full match or a capture group
      const match = args[Number(num)]

      // No match found - return the empty string
      if (!match) {
        return ''
      }

      // Remove trim strings from the match
      const filteredMatch = filterString(match, regexScript.trimStrings, evaluateMacros)

      // TODO: Handle overlay here

      return filteredMatch
    })

    // Substitute at the end
    return evaluateMacros(replaceWithGroups)
  })

  return newString
}

function sanitizeRegexMacro(x: string) {
  if (!x) {
    return x
  }
  return x.replaceAll(/[\n\r\t\v\f\0.^$*+?{}[\]\\/|()]/gs, function (s) {
    switch (s) {
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\t':
        return '\\t'
      case '\v':
        return '\\v'
      case '\f':
        return '\\f'
      case '\0':
        return '\\0'
      default:
        return '\\' + s
    }
  })
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

/**
 * Filters anything to trim from the regex match.
 */
function filterString(
  rawString: string,
  trimStrings: string[],
  evaluateMacros: (content: string) => string,
) {
  let finalString = rawString
  trimStrings.forEach((trimString) => {
    const subTrimString = evaluateMacros(trimString)
    finalString = finalString.replaceAll(subTrimString, '')
  })

  return finalString
}
