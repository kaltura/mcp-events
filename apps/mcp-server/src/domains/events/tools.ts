import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CreateEventDto, ListEventDto, UpdateEventDto, DeleteEventDto } from './schemas'
import { PublicApiClient } from '../../api/publicApiClient'

/**
 * Register event-related tools with the MCP server
 * @param server MCP Server instance
 * @param ks Kaltura Session for this connection (captured in closure)
 * @param publicApiClient Public API client instance
 */
export function registerEventTools(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
  // Tool for creating events
  server.tool(
    'create-event',
    'Creates a new virtual event with provided configuration including name, start/end dates, templates, and timezone settings',
    CreateEventDto.shape,
    {
      title: 'Create a Kaltura Event',
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
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
            { type: 'text', text: `Error creating event: ${error instanceof Error ? error.message : String(error)}` },
          ],
        }
      }
    },
  )

  // Tool for listing events
  server.tool(
    'list-events',
    'get a list of available events',
    ListEventDto.shape,
    {
      title: 'List Events',
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
      readOnlyHint: true,
    },
    async ({ filter, pager }) => {
      try {
        const result = await publicApiClient.listEvents(ks, { filter, pager })
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error listing events: ${error instanceof Error ? error.message : String(error)}` },
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
    {
      title: 'Update an Event',
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ id, name, description, startDate, endDate, doorsOpenDate, timezone, labels, logoEntryId, bannerEntryId }) => {
      try {
        const result = await publicApiClient.updateEvent(ks, {
          id, name, description, startDate, endDate, doorsOpenDate, timezone, labels, logoEntryId, bannerEntryId,
        })
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error updating event: ${error instanceof Error ? error.message : String(error)}` },
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
    {
      title: 'Delete an Event',
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
    async ({ id }) => {
      try {
        const result = await publicApiClient.deleteEvent(ks, id)
        return { content: [{ type: 'text', text: result }] }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error deleting event: ${error instanceof Error ? error.message : String(error)}` },
          ],
        }
      }
    },
  )
}
