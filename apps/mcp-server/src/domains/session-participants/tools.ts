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
  server.tool(
    'add-session-participants',
    'Adds speakers and/or moderators to a session (users must have event-level Speaker/Moderator role)',
    AddSessionParticipantsDto.shape,
    {
      title: 'Add Session Participants',
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ eventId, sessionId, speakers, moderatorIds }) => {
      try {
        const result = await publicApiClient.addSessionParticipants(ks, {
          eventId, sessionId, speakers, moderatorIds,
        })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error adding session participants: ${error instanceof Error ? error.message : String(error)}` },
          ],
        }
      }
    },
  )

  server.tool(
    'remove-session-participants',
    'Removes speakers and/or moderators from a session',
    RemoveSessionParticipantsDto.shape,
    {
      title: 'Remove Session Participants',
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ eventId, sessionId, speakerIds, moderatorIds }) => {
      try {
        const result = await publicApiClient.removeSessionParticipants(ks, {
          eventId, sessionId, speakerIds, moderatorIds,
        })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error removing session participants: ${error instanceof Error ? error.message : String(error)}` },
          ],
        }
      }
    },
  )

  server.tool(
    'list-session-participants',
    'Lists all speakers and moderators for a session',
    ListSessionParticipantsDto.shape,
    {
      title: 'List Session Participants',
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
      readOnlyHint: true,
    },
    async ({ eventId, sessionId }) => {
      try {
        const result = await publicApiClient.listSessionParticipants(ks, { eventId, sessionId })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error listing session participants: ${error instanceof Error ? error.message : String(error)}` },
          ],
        }
      }
    },
  )
}
