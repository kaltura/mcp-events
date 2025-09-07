import assert from 'node:assert'

const Envs = Object.freeze({
  NVP: {
    publicApi: 'https://events-api.nvp1.ovp.kaltura.com',
    epApi: 'https://epm.nvp1.ovp.kaltura.com/epm',
    kalturaApi: 'https://www.kaltura.com/api_v3',
  },
  NVQ: {
    publicApi: 'https://events-api.nvq2.ovp.kaltura.com/api/v1',
    epApi: 'https://epm.nvq2.ovp.kaltura.com/epm',
    kalturaApi: 'https://api.nvq2.ovp.kaltura.com/api_v3',
  },
  EU: {
    publicApi: 'https://events-api.irp2.ovp.kaltura.com/api/v1',
    epApi: 'https://epm.irp2.ovp.kaltura.com/epm',
    kalturaApi: 'https://api.irp2.ovp.kaltura.com/api_v3',
  },
  DE: {
    publicApi: 'https://events-api.frp2.ovp.kaltura.com/api/v1',
    epApi: 'https://epm.frp2.ovp.kaltura.com/epm',
    kalturaApi: 'https://api.frp2.ovp.kaltura.com/api_v3',
  },
})

const env = process.env.KALTURA_ENV || 'NVP'
assert(env in Envs, `Invalid ENV value: ${env}`)

export const config = {
  ks: process.env.KALTURA_KS,
  urls: Envs[env as keyof typeof Envs],
  server: {
    name: 'Events Server',
    version: '1.0.0',
  },
  client: {
    name: 'example-client',
    version: '1.0.0',
  },
}
