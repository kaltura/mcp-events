import { Env } from '@kaltura/commons-utils';

export const McpConfig = {
  kaltura: {
    // Optional: KS from environment for local development only
    // In production, KS should come from request headers
    defaultKs: Env.optStr('KALTURA_KS', ''),
    env: Env.optStr('KALTURA_ENV', 'NVP'),
    publicApi: Env.optStr('KALTURA_PUBLIC_API', ''),
    epApi: Env.optStr('KALTURA_EP_API', ''),
    beApi: Env.optStr('KALTURA_BE_API', ''),
  },
  server: {
    port: Env.optInt('MCP_SERVER_PORT', 3000),
  },
};

console.error('McpConfig loaded:', {
  ...McpConfig,
  kaltura: {
    ...McpConfig.kaltura,
    defaultKs: McpConfig.kaltura.defaultKs ? '*** (fallback mode)' : 'none (request-based mode)',
  },
});
