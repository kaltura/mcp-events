import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CreateTeamMemberDto, UpdateTeamMemberDto, DeleteTeamMemberDto, ListTeamMembersDto } from './schemas'
import { PublicApiClient } from '../../api/publicApiClient'

export function registerTeamMemberTools(
  server: McpServer,
  ks: string,
  publicApiClient: PublicApiClient,
): void {
  server.tool(
    'create-team-member',
    'Creates a new account-level Event Platform team member with the specified role. Team members have platform-wide access (not scoped to a single event). Use invite-event-user to add users to a specific event instead.',
    CreateTeamMemberDto.shape,
    {
      title: 'Create Team Member',
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ email, role, firstName, lastName }) => {
      try {
        const result = await publicApiClient.createTeamMember(ks, { email, role, firstName, lastName })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error creating team member: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    'update-team-member',
    'Updates an account-level Event Platform team member profile or role.',
    UpdateTeamMemberDto.shape,
    {
      title: 'Update Team Member',
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ id, firstName, lastName, role, disabled }) => {
      try {
        const result = await publicApiClient.updateTeamMember(ks, { id, firstName, lastName, role, disabled })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error updating team member: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    'delete-team-member',
    'Removes an account-level Event Platform team member, revoking their platform access.',
    DeleteTeamMemberDto.shape,
    {
      title: 'Delete Team Member',
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ id }) => {
      try {
        const result = await publicApiClient.deleteTeamMember(ks, { id })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting team member: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    'list-team-members',
    'Retrieves a list of account-level Event Platform team members.',
    ListTeamMembersDto.shape,
    {
      title: 'List Team Members',
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
      readOnlyHint: true,
    },
    async ({ pager }) => {
      try {
        const result = await publicApiClient.listTeamMembers(ks, { pager })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error listing team members: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )
}
