import assert from 'node:assert';
import { McpConfig } from '../mcp-config';

const Envs = Object.freeze({
  NVP: {
    publicApi: 'https://events-api.nvp1.ovp.kaltura.com/api/v1',
    epApi: 'https://epm.nvp1.ovp.kaltura.com/epm',
    kalturaApi: 'https://www.kaltura.com/api_v3',
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
  _CUSTOM: {
    publicApi: McpConfig.kaltura.publicApi,
    epApi: McpConfig.kaltura.epApi,
    kalturaApi: McpConfig.kaltura.beApi,
  },
});

// IF one of the custom env vars is not set, we fallback to defaults
const isCustom = McpConfig.kaltura.publicApi && McpConfig.kaltura.epApi && McpConfig.kaltura.beApi;
const env = isCustom ? '_CUSTOM' : McpConfig.kaltura.env;
assert(env in Envs, `Invalid ENV value: ${env}`);

export const config = {
  ks: McpConfig.kaltura.ks,
  urls: Envs[env as keyof typeof Envs],
  server: {
    name: 'Kaltura Events Server',
    version: '1.0.0',
  },
  client: {
    name: 'example-client',
    version: '1.0.0',
  },
};
