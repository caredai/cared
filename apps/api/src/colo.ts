import { getApiPath, getApiUrl } from '@cared/auth/client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const restrictedCountries = [
  'China',
  'Hong Kong',
  'Cuba',
  'Iran',
  'North Korea',
  'Syria',
  'Crimea region',
  'Russia',
  'Belarus',
  'Venezuela',
  'Afghanistan',
  'Eritrea',
  'Libya',
  'South Sudan',
  'Yemen',
]

const restrictedCountryCodes = [
  'CN', // China
  'CU', // Cuba
  'IR', // Iran
  'KP', // North Korea
  'SY', // Syria
  // "UA", // Crimea region - No direct ISO 3166-1 alpha-2 code, as it's part of Ukraine (UA)
  'RU', // Russia
  'BY', // Belarus
  'VE', // Venezuela
  'AF', // Afghanistan
  'ER', // Eritrea
  'LY', // Libya
  'SS', // South Sudan
  'YE', // Yemen
]

let restrictedColo: string | undefined = undefined

export const innerCheckPath = `${getApiPath()}/inner/` + Math.random().toString(36).substring(2)

export function checkRestrictedColoHandler(headers: Headers) {
  const country = headers.get('cf-ipcountry')
  const region = headers.get('cf-region')
  const city = headers.get('cf-ipcity')
  return { country, region, city }
}

// https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties
export async function checkRestrictedColo() {
  // eslint-disable-next-line no-restricted-properties
  if (process.env.NODE_ENV === 'development') {
    return
  }

  if (typeof restrictedColo === 'undefined') {
    const response = await fetch(getApiUrl() + innerCheckPath)
    if (response.status === 200) {
      const text = await response.text()
      try {
        const { country, region, city } = JSON.parse(text)
        console.log('Country checked', getApiUrl() + innerCheckPath, country, region, city)
        if (
          restrictedCountryCodes.includes(country) ||
          (country === 'UA' &&
            (region?.toLowerCase().includes('crimea') ||
              ['Sevastopol', 'Simferopol', 'Kerch'].includes(city))) ||
          // Temporarily only allow Singapore as the single database is located in Singapore
          country !== 'SG'
        ) {
          restrictedColo = `${country}, ${region}, ${city}`
        } else {
          restrictedColo = ''
        }
      } catch (error) {
        console.error(
          'checkRestrictedColo',
          getApiUrl() + innerCheckPath,
          error,
          error instanceof SyntaxError ? text : undefined,
        )
        throw error
      }
    }
  }

  if (restrictedColo) {
    // Intentionally create high latency for restricted regions to prevent
    // Cloudflare Smart Placement from routing requests to these locations
    console.warn(`Country restricted: ${restrictedColo}`)
    // await new Promise((resolve) => setTimeout(resolve, 10000))
  }
}
