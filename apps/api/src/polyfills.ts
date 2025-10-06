import { DOMParser as XDOMParser } from '@xmldom/xmldom'

// https://github.com/cloudflare/workers-sdk/issues/10755#issuecomment-3339049131
globalThis.DOMParser = XDOMParser
