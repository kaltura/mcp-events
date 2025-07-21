import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { publicApiClient } from '../api/publicApiClient'
import assert from 'node:assert'

export const PresetTemplates = Object.freeze([
  {
    templateId: 'tm0000' as const,
    name: 'Blank template',
    description: 'Start from scratch and create your own event.',
    templateLogoUrl: 'https://eventplatform.kaltura.com/assets/images/tm0000.svg',
  },
  {
    templateId: 'tm1000' as const,
    name: 'Interactive session',
    description:
      'Present, speak with your attendees and use engagement tools. Perfect for a small-medium audience.',
    templateLogoUrl: 'https://eventplatform.kaltura.com/assets/images/tm1000.svg',
  },
  {
    templateId: 'tm2000' as const,
    name: 'Live webcast',
    description: 'Broadcast live to an unlimited-sized audience, at the highest production quality.',
    templateLogoUrl: 'https://eventplatform.kaltura.com/assets/images/tm2000.svg',
  },
  {
    templateId: 'tm3000' as const,
    name: 'Pre-recorded live',
    description: 'Record and edit your session in advance, then broadcast it live.',
    templateLogoUrl: 'https://eventplatform.kaltura.com/assets/images/tm3000.svg',
  },
  {
    templateId: 'tm4000' as const,
    name: 'DIY live broadcast',
    description:
      'Broadcast live from a virtual studio room with no production needed. Solo or with multiple speakers.',
    templateLogoUrl: 'https://eventplatform.kaltura.com/assets/images/tm4000.svg',
  },
])

/**
 * Register event-related tools with the MCP server
 */
export function registerEventResources(server: McpServer): void {
  // Dynamic resource with parameters
  server.registerResource(
    'events',
    new ResourceTemplate('events://{eventId}/info', { list: undefined }),
    {
      title: 'Kaltura Event Information',
      description: 'Provides information about a specific Kaltura event',
    },
    async (uri, { eventId }) => {
      try {
        assert(typeof Number(eventId) === 'number', `eventId must be a number, received: ${typeof eventId}`)
        const result = await publicApiClient.listEvents({
          filter: { idIn: [Number(eventId)] },
          pager: { limit: 1, offset: 0 },
        })
        assert((result as { totalCount?: number }).totalCount, `event ${eventId} not found!`)
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify((result as { events: [unknown] }).events[0], null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error getting event: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.registerResource(
    'preset-templates',
    'preset-templates://all',
    {
      title: 'Kaltura Preset Templates',
      description: 'Provides a list of all available Kaltura preset templates',
      mimeType: 'text/plain',
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(PresetTemplates, null, 2),
          },
        ],
      }
    },
  )
}
