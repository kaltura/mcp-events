export const config = {
  ks: process.env.KS,
  urls: {
    publicApi: 'https://events-api.nvq2.ovp.kaltura.com/api/v1',
    epApi: 'https://epm.nvq2.ovp.kaltura.com/epm',
    kalturaApi: 'https://api.nvq2.ovp.kaltura.com/api_v3',
  },
  server: {
    name: 'Events Server',
    version: '1.0.0',
  },
  client: {
    name: 'example-client',
    version: '1.0.0',
  },
}
