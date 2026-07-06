// Central configuration for the functional test suite.
//
// Env vars are injected by `node --env-file=tests/.env` (see the `test:functional`
// script), so this module only reads `process.env` and applies the same names and
// defaults as the Python `config.py`.

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const config = {
  KALTURA_KS: required('KALTURA_KS'),
  KALTURA_PUBLIC_API: process.env.KALTURA_PUBLIC_API ?? 'https://events-api.nvp1.ovp.kaltura.com/api/v1',
  MCP_SERVER_URL: process.env.MCP_SERVER_URL ?? 'http://localhost:3000/mcp',
  EXECUTE_TOOLS: process.env.EXECUTE_TOOLS === '1',
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: required('ANTHROPIC_MODEL'),
} as const
