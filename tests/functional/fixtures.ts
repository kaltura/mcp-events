// Shared setup/teardown helpers, ported from the Python `fixtures.py`.

import { config } from './config'
import { createNearestEventByApi, deleteEventByApi } from './eventsHelper'
import { mcpSession } from './mcpAgent'

/**
 * Create a real Kaltura event, run `fn` with its ID, then delete it.
 * Replaces the `nearest_temp_event_id` pytest fixture. A failed delete only warns.
 */
export async function withTempEvent(fn: (eventId: number) => Promise<void>): Promise<void> {
  const eventId = await createNearestEventByApi()
  try {
    await fn(eventId)
  } finally {
    try {
      await deleteEventByApi(eventId)
    } catch {
      console.warn(`Event ${eventId} was not deleted`)
    }
  }
}

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
