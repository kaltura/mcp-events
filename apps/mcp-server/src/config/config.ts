import assert from 'node:assert'

const Envs = Object.freeze({
  NVP: {
    publicApi: 'https://events-api.nvp1.ovp.kaltura.com/api/v1',
  },
  EU: {
    publicApi: 'https://events-api.irp2.ovp.kaltura.com/api/v1',
  },
  DE: {
    publicApi: 'https://events-api.frp2.ovp.kaltura.com/api/v1',
  },
  _CUSTOM: {
    publicApi: process.env.KALTURA_PUBLIC_API,
  },
})

// IF one of the custom env vars is not set, we fallback to defaults
const isCustom = process.env.KALTURA_PUBLIC_API
const env = isCustom ? '_CUSTOM' : process.env.KALTURA_ENV || 'NVP'
assert(env in Envs, `Invalid ENV value: ${env}`)

export const config = {
  kaltura: {
    urls: Envs[env as keyof typeof Envs],
    ks: process.env.KALTURA_KS,
  },
  server: {
    port: process.env.KALTURA_SERVER_PORT ?? 3000,
    name: 'Kaltura Events Server',
    version: '1.0.0',
  },
  auth: {
    gatewayUrl: process.env.KALTURA_AUTH_GATEWAY_URL,
    jwtSecret: process.env.AUTH_GATEWAY_JWT_SECRET,
    serverUrl: process.env.MCP_SERVER_URL,
  },
}
