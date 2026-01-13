import assert from 'node:assert'
import { Env } from '@kaltura/commons-utils'

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
    publicApi: McpConfig.kaltura.publicApi,
    kalturaApi: McpConfig.kaltura.beApi,
  },
})

// IF one of the custom env vars is not set, we fallback to defaults
const isCustom = McpConfig.kaltura.publicApi && McpConfig.kaltura.epApi && McpConfig.kaltura.beApi
const env = isCustom ? '_CUSTOM' : McpConfig.kaltura.env
assert(env in Envs, `Invalid ENV value: ${env}`)

export const config = {
  urls: Envs[env as keyof typeof Envs],
  server: {
    port: Env.optInt('KALTURA_SERVER_PORT', 3000),
    name: 'Kaltura Events Server',
    version: '1.0.0',
  },
  client: {
    name: 'example-client',
    version: '1.0.0',
  },
}
