import { Env } from '@kaltura/commons-utils';

export const McpConfig = {
  kaltura: {
    ks: Env.secret('KALTURA_KS').get(),
    env: Env.optStr('KALTURA_ENV', 'NVP'),
    publicApi: Env.optStr('KALTURA_PUBLIC_API', ''),
    epApi: Env.optStr('KALTURA_EP_API', ''),
    beApi: Env.optStr('KALTURA_BE_API', ''),
  },
  server: {
    port: Env.int('MCP_SERVER_PORT'),
  },
};

console.log('McpConfig loaded:', {
  ...McpConfig,
  kaltura: {
    ...McpConfig.kaltura,
    ks: McpConfig.kaltura.ks ? '***' : undefined,
  },
});
