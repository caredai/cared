import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici'

// See: https://github.com/nodejs/undici/blob/main/docs/docs/api/EnvHttpProxyAgent.md
setGlobalDispatcher(new EnvHttpProxyAgent())
