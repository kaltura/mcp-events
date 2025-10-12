import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CreatePollDto } from '../schemas/pollSchemas'
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
}
