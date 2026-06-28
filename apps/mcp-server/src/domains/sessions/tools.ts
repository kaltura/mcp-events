import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ListSessionDto, CreateSessionDto } from './schemas'
import { PublicApiClient } from '../../api/publicApiClient'
import { hasScopes } from '../../auth/scope-check'

/**
 * Register session-related tools with the MCP server.
 * Only tools covered by the granted scopes are registered.
 * @param server MCP Server instance
 * @param ks Kaltura Session for this connection (captured in closure)
 * @param publicApiClient Public API client instance
 * @param scopes Granted OAuth scopes for this request
 */
export function registerSessionTools(
  server: McpServer,
  ks: string,
  publicApiClient: PublicApiClient,
  scopes: string[],
): void {
  if (hasScopes(scopes, ['sessions:write'])) {
    server.registerTool(
      'create-event-session',
      {
        title: 'Create an Event Session',
        description:
          'Creates a new session for a specific event. Required fields: name, description, startDate, and endDate (all ISO 8601). Optional: type, tags, visibility, and other settings.',
        inputSchema: CreateSessionDto,
        annotations: {
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
          readOnlyHint: false,
        },
      },
      async ({ id, session }) => {
        try {
          const result = await publicApiClient.createSession(ks, id, session)
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error creating event session: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )
  }

  if (hasScopes(scopes, ['sessions:read'])) {
    server.registerTool(
      'list-event-sessions',
      {
        title: 'List Event Sessions',
        description: 'Retrieves a list of sessions for a specific event',
        inputSchema: ListSessionDto,
        annotations: {
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
          readOnlyHint: true,
        },
      },
      async ({ eventId }) => {
        try {
          const result = await publicApiClient.listSessions(ks, eventId)
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error listing event sessions: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )
  }
}
