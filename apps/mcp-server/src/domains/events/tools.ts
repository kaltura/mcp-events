import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CreateEventDto, ListEventDto, UpdateEventDto, DeleteEventDto, DuplicateEventDto } from './schemas'
import { PublicApiClient } from '../../api/publicApiClient'

/**
 * Register event-related tools with the MCP server
 * @param server MCP Server instance
 * @param ks Kaltura Session for this connection (captured in closure)
 * @param publicApiClient Public API client instance
 */
export function registerEventTools(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
  server.registerTool(
    'create-event',
    {
      title: 'Create a Kaltura Event',
      description:
        'Creates a new virtual event with provided configuration including name, start/end dates, templates, and timezone settings',
      inputSchema: CreateEventDto,
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
    },
    async ({ name, templateId, startDate, endDate, timezone, description }) => {
      try {
        const result = await publicApiClient.createEvent(ks, {
          name,
          templateId,
          startDate,
          endDate,
          timezone,
          description,
        })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error creating event: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.registerTool(
    'list-events',
    {
      title: 'List Events',
      description: 'get a list of available events',
      inputSchema: ListEventDto,
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: true, readOnlyHint: true },
    },
    async ({ filter, pager }) => {
      try {
        const result = await publicApiClient.listEvents(ks, { filter, pager })
        return { content: [{ type: 'text', text: JSON.stringify(result) }] }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error listing events: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.registerTool(
    'update-event',
    {
      title: 'Update an Event',
      description:
        "Modifies an existing event's properties such as name, dates, banner, logo, and other configuration settings",
      inputSchema: UpdateEventDto,
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
    },
    async ({
      id,
      name,
      description,
      startDate,
      endDate,
      doorsOpenDate,
      timezone,
      labels,
      logoEntryId,
      bannerEntryId,
    }) => {
      try {
        const result = await publicApiClient.updateEvent(ks, {
          id,
          name,
          description,
          startDate,
          endDate,
          doorsOpenDate,
          timezone,
          labels,
          logoEntryId,
          bannerEntryId,
        })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error updating event: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.registerTool(
    'delete-event',
    {
      title: 'Delete an Event',
      description:
        'Permanently removes an event by its ID, including all associated resources and configurations',
      inputSchema: DeleteEventDto,
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: true, readOnlyHint: false },
    },
    async ({ id }) => {
      try {
        const result = await publicApiClient.deleteEvent(ks, id)
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting event: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.registerTool(
    'duplicate-event',
    {
      title: 'Duplicate an Event',
      description:
        'Creates a copy of an existing event with all its configurations. Starts the duplication job, polls until complete (up to ~90s), then returns the full duplicated event details.',
      inputSchema: DuplicateEventDto,
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
    },
    async ({ sourceEventId, name, timezone, description, startDate, endDate, duplicateUsers }) => {
      const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
      try {
        const initResult = await publicApiClient.duplicateEvent(ks, {
          sourceEventId,
          event: { name, timezone, description, startDate, endDate },
          duplicateUsers,
        })

        if (initResult.status !== 'ok' || !initResult.jobId) {
          return {
            content: [{ type: 'text', text: `Failed to start duplication: ${JSON.stringify(initResult)}` }],
          }
        }

        const { jobId } = initResult
        const MAX_ATTEMPTS = 9
        let lastJobState = 'unknown'

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          await sleep(10_000)
          const statusResult = await publicApiClient.getDuplicateStatus(ks, jobId)
          lastJobState = statusResult.jobState

          if (statusResult.jobState === 'completed' && statusResult.eventId != null) {
            const event = await publicApiClient.listEvents(ks, { filter: { idIn: [Number(statusResult.eventId)] } })
            return { content: [{ type: 'text', text: JSON.stringify(event) }] }
          }

          if (statusResult.jobState === 'failed') {
            return {
              content: [
                {
                  type: 'text',
                  text: `Duplication job failed. jobId: ${jobId}, status: ${statusResult.status}`,
                },
              ],
            }
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: `Duplication job did not complete within 90 seconds. jobId: ${jobId}, last jobState: ${lastJobState}. You can check the status later.`,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error duplicating event: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )
}
