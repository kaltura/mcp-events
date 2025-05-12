import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { config } from './config/config'
import path from 'path'

/**
 * Example client for testing the MCP server
 */
export async function runClient(): Promise<Client> {
  // Create a transport that connects to the server
  const serverPath = path.join(process.cwd(), 'dist', 'index.js')
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
  })

  // Create a client
  const client = new Client({
    name: config.client.name,
    version: config.client.version,
  })

  try {
    await client.connect(transport)

    // List available tools
    const tools = await client.listTools()

    // Example: Create an event
    const createResult = await client.callTool({
      name: 'create-event',
      arguments: {
        templateId: 'example-template-123',
        name: 'Test Event',
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endDate: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 25 hours
        timezone: 'America/New_York',
        description: 'This is a test event created by the MCP client',
      },
    })

    // Example: List events
    const listResult = await client.callTool({
      name: 'list-events',
      arguments: {
        filter: {
          searchTerm: 'Test',
        },
        pager: {
          offset: 0,
          limit: 10,
        },
      },
    })

    return client
  } catch (error) {
    throw error
  }
}

// Run the client if this file is executed directly
if (require.main === module) {
  runClient().catch(console.error)
}
