import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ListSessionDto, CreateSessionDto } from './schemas'
import { PublicApiClient } from '../../api/publicApiClient'

/**
 * Register session-related tools with the MCP server
 * @param server MCP Server instance
 * @param ks Kaltura Session for this connection (captured in closure)
 * @param publicApiClient Public API client instance
 */
export function registerSessionTools(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
  server.registerTool(
    'create-event-session',
    {
      title: 'Create an Event Session',
      description:
        'Creates a new session for a specific event with provided configuration including name, description, start/end dates, and visibility settings',
      inputSchema: CreateSessionDto,
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: true, readOnlyHint: false },
    },
    async ({ id, session }) => {
      try {
        const result = await publicApiClient.createSession(ks, id, session)
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
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

  server.registerTool(
    'list-event-sessions',
    {
      title: 'List Event Sessions',
      description: 'Retrieves a list of sessions for a specific event',
      inputSchema: ListSessionDto,
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: true, readOnlyHint: true },
    },
    async ({ eventId }) => {
      try {
        const result = await publicApiClient.listSessions(ks, eventId)
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
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
