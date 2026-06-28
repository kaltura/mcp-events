import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { InviteEventUserDto, ListEventUsersDto, UpdateEventUserDto, DeleteEventUserDto } from './schemas'
import { PublicApiClient } from '../../api/publicApiClient'
import { hasScopes } from '../../auth/scope-check'

/**
 * Register event-user tools with the MCP server.
 * Only tools covered by the granted scopes are registered.
 * @param scopes Granted OAuth scopes for this request
 */
export function registerEventUserTools(
  server: McpServer,
  ks: string,
  publicApiClient: PublicApiClient,
  scopes: string[],
): void {
  if (hasScopes(scopes, ['event-users:write'])) {
    server.registerTool(
      'invite-event-user',
      {
        title: 'Invite Event User',
        description: 'Invites a user to the event with the specified roles and profile data',
        inputSchema: InviteEventUserDto,
        annotations: {
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
          readOnlyHint: false,
        },
      },
      async ({
        eventId,
        firstName,
        lastName,
        email,
        title,
        company,
        bio,
        roles,
        imageUrlEntryId,
        skipEmail,
      }) => {
        try {
          const result = await publicApiClient.inviteEventUser(ks, {
            eventId,
            firstName,
            lastName,
            email,
            title,
            company,
            bio,
            roles,
            imageUrlEntryId,
            skipEmail,
          })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error inviting event user: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )

    server.registerTool(
      'update-event-user',
      {
        title: 'Update Event User',
        description:
          "Updates an event user profile and roles (role updates replace the user's current roles via diff)",
        inputSchema: UpdateEventUserDto,
        annotations: {
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
          readOnlyHint: false,
        },
      },
      async ({ eventId, userId, firstName, lastName, title, company, bio, roles, imageUrlEntryId }) => {
        try {
          const result = await publicApiClient.updateEventUser(ks, {
            eventId,
            userId,
            firstName,
            lastName,
            title,
            company,
            bio,
            roles,
            imageUrlEntryId,
          })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error updating event user: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )

    server.registerTool(
      'delete-event-user',
      {
        title: 'Delete Event User',
        description: 'Removes a user from the event context including their session roles and groups',
        inputSchema: DeleteEventUserDto,
        annotations: {
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: true,
          readOnlyHint: false,
        },
      },
      async ({ eventId, userId }) => {
        try {
          const result = await publicApiClient.deleteEventUser(ks, { eventId, userId })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error deleting event user: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )
  }

  if (hasScopes(scopes, ['event-users:read'])) {
    server.registerTool(
      'list-event-users',
      {
        title: 'List Event Users',
        description: 'Returns a paginated list of event users with optional filtering and sorting',
        inputSchema: ListEventUsersDto,
        annotations: {
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
          readOnlyHint: true,
        },
      },
      async ({ eventId, filter, pager, orderBy }) => {
        try {
          const result = await publicApiClient.listEventUsers(ks, { eventId, filter, pager, orderBy })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error listing event users: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )
  }
}
