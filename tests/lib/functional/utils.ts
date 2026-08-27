// Shared setup/teardown helpers, ported from the Python `fixtures.py`.

import { config } from './config'
import { mcpSession } from './mcpAgent'

/**
 * Verify both the MCP server and the Anthropic endpoint are reachable before running tests.
 * Mirrors the autouse `check_mcp_server_connection` fixture (fails, not skips, on error).
 */
export async function checkConnections(): Promise<void> {
  let client
  try {
    client = await mcpSession()
    await client.listTools()
  } catch (err) {
    throw new Error(`MCP server unreachable: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    await client?.close()
  }

  const anthropicUrl = config.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com'
  try {
    await fetch(anthropicUrl, { signal: AbortSignal.timeout(30_000) })
  } catch (err) {
    throw new Error(
      `Anthropic API unreachable at ${anthropicUrl}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}

export function authHeaders(): Record<string, string> {
  return {
    Authorization: `ks ${config.KALTURA_KS}`,
    'Content-Type': 'application/json',
  }
}
