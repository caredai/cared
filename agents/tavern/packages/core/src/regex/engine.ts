import { RegexPlacement, RegexScript, RegexSubstituteMode } from './types'

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

export function getRegexedString(
  regexScripts: RegexScript[],
  rawString: string,
  placement: RegexPlacement,
  evaluateMacros: (content: string, postProcessFn?: (s: string) => string) => string,
  {
    isMarkdown,
    isPrompt,
    isEdit,
    depth,
  }: {
    isMarkdown?: boolean
    isPrompt?: boolean
    isEdit?: boolean
    depth?: number
  },
) {
  if (!rawString) {
    return ''
  }

  let finalString = rawString

  regexScripts.forEach((script) => {
    if (
      // Script applies to Markdown and input is Markdown
      (script.displayOnly && isMarkdown) ||
      // Script applies to Generate and input is Generate
      (script.promptOnly && isPrompt) ||
      // Script applies to all cases when neither "only"s are true, but there's no need to do it when `isMarkdown`, the as source (chat history) should already be changed beforehand
      (!script.displayOnly && !script.promptOnly && !isMarkdown && !isPrompt)
    ) {
      if (isEdit && !script.runOnEdit) {
        console.debug(
          `getRegexedString: Skipping script ${script.name} because it does not run on edit`,
        )
        return
      }

      // Check if the depth is within the min/max depth
      if (typeof depth === 'number') {
        if (
          typeof script.minDepth === 'number' &&
          script.minDepth >= -1 &&
          depth < script.minDepth
        ) {
          console.debug(
            `getRegexedString: Skipping script ${script.name} because depth ${depth} is less than minDepth ${script.minDepth}`,
          )
          return
        }

        if (
          typeof script.maxDepth === 'number' &&
          script.maxDepth >= 0 &&
          depth > script.maxDepth
        ) {
          console.debug(
            `getRegexedString: Skipping script ${script.name} because depth ${depth} is greater than maxDepth ${script.maxDepth}`,
          )
          return
        }
      }

      if (script.placement.includes(placement)) {
        finalString = runRegexScript(script, finalString, evaluateMacros)
      }
    }
  })

  return finalString
}
