import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { InviteEventUserDto, ListEventUsersDto, UpdateEventUserDto, DeleteEventUserDto } from './schemas'
import { PublicApiClient } from '../../api/publicApiClient'

export function registerEventUserTools(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
  server.tool(
    'invite-event-user',
    'Invites a user to the event with the specified roles and profile data',
    InviteEventUserDto.shape,
    {
      title: 'Invite Event User',
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ eventId, firstName, lastName, email, title, company, bio, roles, imageUrlEntryId, skipEmail }) => {
      try {
        const result = await publicApiClient.inviteEventUser(ks, {
          eventId, firstName, lastName, email, title, company, bio, roles, imageUrlEntryId, skipEmail,
        })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error inviting event user: ${error instanceof Error ? error.message : String(error)}` },
          ],
        }
      }
    },
  )

  server.tool(
    'list-event-users',
    'Returns a paginated list of event users with optional filtering and sorting',
    ListEventUsersDto.shape,
    {
      title: 'List Event Users',
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
      readOnlyHint: true,
    },
    async ({ eventId, filter, pager, orderBy }) => {
      try {
        const result = await publicApiClient.listEventUsers(ks, { eventId, filter, pager, orderBy })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error listing event users: ${error instanceof Error ? error.message : String(error)}` },
          ],
        }
      }
    },
  )

  server.tool(
    'update-event-user',
    "Updates an event user profile and roles (role updates replace the user's current roles via diff)",
    UpdateEventUserDto.shape,
    {
      title: 'Update Event User',
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ eventId, userId, firstName, lastName, title, company, bio, roles, imageUrlEntryId }) => {
      try {
        const result = await publicApiClient.updateEventUser(ks, {
          eventId, userId, firstName, lastName, title, company, bio, roles, imageUrlEntryId,
        })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error updating event user: ${error instanceof Error ? error.message : String(error)}` },
          ],
        }
      }
    },
  )

  server.tool(
    'delete-event-user',
    'Removes a user from the event context including their session roles and groups',
    DeleteEventUserDto.shape,
    {
      title: 'Delete Event User',
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ eventId, userId }) => {
      try {
        const result = await publicApiClient.deleteEventUser(ks, { eventId, userId })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error deleting event user: ${error instanceof Error ? error.message : String(error)}` },
          ],
        }
      }
    },
  )
}
