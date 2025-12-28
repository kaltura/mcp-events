import assert from 'node:assert'

const Envs = Object.freeze({
  NVP: {
    publicApi: 'https://events-api.nvp1.ovp.kaltura.com/api/v1',
    kalturaApi: 'https://www.kaltura.com/api_v3',
  },
  EU: {
    publicApi: 'https://events-api.irp2.ovp.kaltura.com/api/v1',
    kalturaApi: 'https://api.irp2.ovp.kaltura.com/api_v3',
  },
  DE: {
    publicApi: 'https://events-api.frp2.ovp.kaltura.com/api/v1',
    kalturaApi: 'https://api.frp2.ovp.kaltura.com/api_v3',
  },
  _CUSTOM: {
    publicApi: process.env.KALTURA_PUBLIC_API,
    kalturaApi: process.env.KALTURA_BE_API,
  },
})

// IF one of the custom env vars is not set, we fallback to defaults
const isCustom = process.env.KALTURA_PUBLIC_API && process.env.KALTURA_BE_API
const env = isCustom ? '_CUSTOM' : process.env.KALTURA_ENV || 'NVP'
assert(env in Envs, `Invalid ENV value: ${env}`)

export const config = {
  ks: process.env.KALTURA_KS,
  urls: Envs[env as keyof typeof Envs],
  server: {
    name: 'Kaltura Events Server',
    version: '1.0.0',
  },
  client: {
    name: 'example-client',
    version: '1.0.0',
  },
}
