import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  AddSessionParticipantsDto,
  RemoveSessionParticipantsDto,
  UpdateSessionParticipantsDto,
  ListSessionParticipantsDto,
} from './schemas'
import { PublicApiClient } from '../../api/publicApiClient'
import { hasScopes } from '../../auth/scope-check'

/**
 * Register session-participant tools with the MCP server.
 * Only tools covered by the granted scopes are registered.
 * @param scopes Granted OAuth scopes for this request
 */
export function registerSessionParticipantTools(
  server: McpServer,
  ks: string,
  publicApiClient: PublicApiClient,
  scopes: string[],
): void {
  if (hasScopes(scopes, ['session-participants:write'])) {
    server.registerTool(
      'add-session-participants',
      {
        title: 'Add Session Participants',
        description:
          "Adds speakers and/or moderators to a session (users must have event-level Speaker/Moderator role). To update an existing speaker's role, order, or visibility, use update-session-participants instead. To preserve or set a specific order, call list-session-participants first to see current order values — when order is omitted, the speaker is added with order 0.",
        inputSchema: AddSessionParticipantsDto,
        annotations: {
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
          readOnlyHint: false,
        },
      },
      async ({ eventId, sessionId, speakers, moderatorIds }) => {
        try {
          const result = await publicApiClient.addSessionParticipants(ks, {
            eventId,
            sessionId,
            speakers,
            moderatorIds,
          })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error adding session participants: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )

    server.registerTool(
      'remove-session-participants',
      {
        title: 'Remove Session Participants',
        description: 'Removes speakers and/or moderators from a session',
        inputSchema: RemoveSessionParticipantsDto,
        annotations: {
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: true,
          readOnlyHint: false,
        },
      },
      async ({ eventId, sessionId, speakerIds, moderatorIds }) => {
        try {
          const result = await publicApiClient.removeSessionParticipants(ks, {
            eventId,
            sessionId,
            speakerIds,
            moderatorIds,
          })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error removing session participants: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )

    server.registerTool(
      'update-session-participants',
      {
        title: 'Update Session Participants',
        description:
          'Updates properties of speakers already assigned to a session (role, order, visibility). Only the fields provided are changed — omitted fields remain unchanged.',
        inputSchema: UpdateSessionParticipantsDto,
        annotations: {
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
          readOnlyHint: false,
        },
      },
      async ({ eventId, sessionId, speakers }) => {
        try {
          const result = await publicApiClient.updateSessionParticipants(ks, { eventId, sessionId, speakers })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error updating session participants: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )
  }

  if (hasScopes(scopes, ['session-participants:read'])) {
    server.registerTool(
      'list-session-participants',
      {
        title: 'List Session Participants',
        description: 'Lists all speakers and moderators for a session',
        inputSchema: ListSessionParticipantsDto,
        annotations: {
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
          readOnlyHint: true,
        },
      },
      async ({ eventId, sessionId }) => {
        try {
          const result = await publicApiClient.listSessionParticipants(ks, { eventId, sessionId })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error listing session participants: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )
  }
}
