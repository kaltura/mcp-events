import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { PublicApiClient } from '../../api/publicApiClient'
import assert from 'node:assert'
import { PresetTemplates } from '../../resources/presetTemplates'
import { hasScopes } from '../../auth/scope-check'

/**
 * Register event-related resources with the MCP server.
 * Only resources covered by the granted scopes are registered.
 * @param server MCP Server instance
 * @param ks Kaltura Session for this connection (captured in closure)
 * @param publicApiClient Public API client instance
 * @param scopes Granted OAuth scopes for this request
 */
export function registerEventResources(
  server: McpServer,
  ks: string,
  publicApiClient: PublicApiClient,
  scopes: string[],
): void {
  if (!hasScopes(scopes, ['mcp:events:read'])) {
    return
  }

  server.registerResource(
    'events',
    new ResourceTemplate('events://{eventId}/info', { list: undefined }),
    {
      title: 'Kaltura Event Information',
      description: 'Provides information about a specific Kaltura event',
    },
    async (uri, { eventId }) => {
      try {
        assert(typeof Number(eventId) === 'number', `eventId must be a number, received: ${typeof eventId}`)
        const result = await publicApiClient.listEvents(ks, {
          filter: { idIn: [Number(eventId)] },
          pager: { limit: 1, offset: 0 },
        })
        assert((result as { totalCount?: number }).totalCount, `event ${eventId} not found!`)
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify((result as { events: [unknown] }).events[0], null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error getting event: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.registerResource(
    'preset-templates',
    'preset-templates://all',
    {
      title: 'Kaltura Preset Templates',
      description: 'Provides a list of all available Kaltura preset templates',
      mimeType: 'text/plain',
    },
    async (uri) => {
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(PresetTemplates, null, 2) }],
      }
    },
  )
}
