/** Number of asterisks between token start and end hints (matches OAuth client secret display). */
const MASKED_TOKEN_MIDDLE = '**************************'

/** Format API token start/end hints into a masked display string. */
export function formatMaskedApiToken(start: string, end: string) {
  return `${start}${MASKED_TOKEN_MIDDLE}${end}`
}
