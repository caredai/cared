export function formatMessage(message: string) {
  message = sanitizeText(message)

  message = message.replace(
    /```[\s\S]*?```|``[\s\S]*?``|`[\s\S]*?`|(".*?")|(\u201C.*?\u201D)|(\u00AB.*?\u00BB)|(\u300C.*?\u300D)|(\u300E.*?\u300F)|(\uFF02.*?\uFF02)/gm,
    function (match, p1, p2, p3, p4, p5, p6) {
      if (p1) {
        // English double quotes
        return `<q>"${p1.slice(1, -1)}"</q>`
      } else if (p2) {
        // Curly double quotes “ ”
        return `<q>“${p2.slice(1, -1)}”</q>`
      } else if (p3) {
        // Guillemets « »
        return `<q>«${p3.slice(1, -1)}»</q>`
      } else if (p4) {
        // Corner brackets 「 」
        return `<q>「${p4.slice(1, -1)}」</q>`
      } else if (p5) {
        // White corner brackets 『 』
        return `<q>『${p5.slice(1, -1)}』</q>`
      } else if (p6) {
        // Fullwidth quotes ＂ ＂
        return `<q>＂${p6.slice(1, -1)}＂</q>`
      } else {
        // Return the original match if no quotes are found
        return match
      }
    },
  )

  return message
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '')
}

export async function fetchWithErrorHandlers(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const response = await fetch(input, init)

    // TODO: error handling

    return response
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // TODO: error handling
      throw new Error('Offline')
    }

    throw error
  }
}
