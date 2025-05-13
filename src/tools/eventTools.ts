import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  CreateEventDto,
  ListEventDto,
  UpdateEventDto,
  DeleteEventDto,
  ListSessionDto,
} from '../schemas/eventSchemas'
import { publicApiClient } from '../api/publicApiClient'
import { epClient } from '../api/epClient'

/**
 * Register event-related tools with the MCP server
 */
export function registerEventTools(server: McpServer): void {
  // Tool for creating events
  server.tool(
    'create-event',
    'Creates a new virtual event with provided configuration including name, start/end dates, templates, and timezone settings',
    CreateEventDto.shape,
    async ({ name, templateId, startDate, endDate, timezone, description }) => {
      try {
        const result = await publicApiClient.createEvent({
          name,
          templateId,
          startDate,
          endDate,
          timezone,
          description,
        })

        return {
          content: [{ type: 'text', text: result }],
        }
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

  // Tool for listing events
  server.tool(
    'list-events',
    'Retrieves a paginated list of events with filtering and sorting options to manage large event catalogs',
    ListEventDto.shape,
    async ({ filter, pager }) => {
      try {
        const result = await publicApiClient.listEvents({ filter, pager })

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
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

  // Tool for updating events
  server.tool(
    'update-event',
    "Modifies an existing event's properties such as name, dates, banner, logo, and other configuration settings",
    UpdateEventDto.shape,
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
        const result = await publicApiClient.updateEvent({
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

        return {
          content: [{ type: 'text', text: result }],
        }
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

  // Tool for deleting events
  server.tool(
    'delete-event',
    'Permanently removes an event by its ID, including all associated resources and configurations',
    DeleteEventDto.shape,
    async ({ id }) => {
      try {
        const result = await publicApiClient.deleteEvent(id)

        return {
          content: [{ type: 'text', text: result }],
        }
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

  // Tool for listing an event sessions
  server.tool(
    'list-event-sessions',
    'Retrieves a list of sessions for a specific event',
    ListSessionDto.shape,
    async ({ filter, id }) => {
      try {
        const result = await epClient.sessionList(id, filter?.tagsFilter)

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
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
