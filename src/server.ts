import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { config } from './config/config'
import { registerEventTools } from './tools/eventTools'
import { registerEventResources } from './resources/eventResources'
import { registerPollTools } from './tools/pollTools'

/**
 * Initialize and start the MCP server
 */
export async function startServer(): Promise<McpServer> {
  try {
    // Create an MCP server with configuration
    const server = new McpServer({
      name: config.server.name,
      version: config.server.version,
    })

    // Register all tools
    registerEventTools(server)
    // Register all resources
    registerEventResources(server)
    // Register poll tools
    registerPollTools(server)

    // Create a transport for communication
    const transport = new StdioServerTransport()
    // Connect the server to the transport
    await server.connect(transport)

    return server
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    throw error
  }
}
