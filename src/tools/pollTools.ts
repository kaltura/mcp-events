import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CreatePollDto, DeletePollDto, ListPollsDto, UpdatePollDto } from '../schemas/pollSchemas'
import { cncApiClient } from '../api/cncApiClient'

/**
 * Register poll-related tools with the MCP server
 */
export function registerPollTools(server: McpServer): void {
  // Tool for creating polls
  server.tool(
    'create-poll',
    'Creates ',
    CreatePollDto.shape,
    {
      title:
        'Create a Kaltura Poll, associated with the provided contextId/session id (entry id  or channel id)',
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({
      contextId,
      state,
      showResults,
      content,
      type,
      autoCloseMilliseconds,
      scheduling,
      isAcceptingMultipleVotes,
      visualization,
      trackWordFrequency,
      groupPoll,
    }) => {
      try {
        const result = await cncApiClient.createPoll({
          contextId,
          state,
          showResults,
          content,
          type,
          autoCloseMilliseconds,
          scheduling,
          isAcceptingMultipleVotes,
          visualization,
          trackWordFrequency,
          groupPoll,
        })

        return {
          content: [{ type: 'text', text: result }],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error creating poll: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    'update-poll',
    'Updates an existing poll',
    UpdatePollDto.shape,
    {
      title: 'Update an existing Kaltura Poll',
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({
      _id,
      contextId,
      state,
      showResults,
      content,
      type,
      autoCloseMilliseconds,
      scheduling,
      isAcceptingMultipleVotes,
      visualization,
      trackWordFrequency,
      groupPoll,
      isEnded,
    }) => {
      try {
        const result = await cncApiClient.updatePoll({
          _id,
          contextId,
          state,
          showResults,
          content,
          type,
          autoCloseMilliseconds,
          scheduling,
          isAcceptingMultipleVotes,
          visualization,
          trackWordFrequency,
          groupPoll,
          isEnded,
        })

        return {
          content: [{ type: 'text', text: result }],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error updating poll: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    'list-polls',
    'Lists all polls for a given contextId/session (entry id or channel id)',
    ListPollsDto.shape,
    {
      title: 'List all polls for a given contextId/session (entry id or channel id)',
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
      readOnlyHint: true,
    },
    async ({ contextId }) => {
      try {
        const result = await cncApiClient.listPolls({ contextId })

        return {
          content: [{ type: 'text', text: result }],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error listing polls: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    'delete-poll',
    'Deletes an existing poll',
    DeletePollDto.shape,
    {
      title: 'Delete an existing Kaltura Poll',
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ pollId }) => {
      try {
        const result = await cncApiClient.deletePoll({ pollId })

        return {
          content: [{ type: 'text', text: result }],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting poll: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )
}
