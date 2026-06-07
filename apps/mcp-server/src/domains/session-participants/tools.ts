import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  AddSessionParticipantsDto,
  RemoveSessionParticipantsDto,
  ListSessionParticipantsDto,
} from './schemas'
import { PublicApiClient } from '../../api/publicApiClient'

export function registerSessionParticipantTools(
  server: McpServer,
  ks: string,
  publicApiClient: PublicApiClient,
): void {
  server.registerTool(
    'add-session-participants',
    {
      title: 'Add Session Participants',
      description:
        'Adds speakers and/or moderators to a session (users must have event-level Speaker/Moderator role)',
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
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: true, readOnlyHint: false },
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
    'list-session-participants',
    {
      title: 'List Session Participants',
      description: 'Lists all speakers and moderators for a session',
      inputSchema: ListSessionParticipantsDto,
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: true, readOnlyHint: true },
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
