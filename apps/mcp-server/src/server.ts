import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { config } from './config/config'
import { registerEventTools } from './tools/eventTools'
import { registerEventResources } from './resources/eventResources'
import { PublicAPIClient } from './api/publicApiClient'
import { EpClient } from './api/epClient'
import { McpConfig } from './mcp-config'

/**
 * Initialize and start the MCP server (stdio mode for local development)
 * Uses KALTURA_KS environment variable for authentication
 */
export async function startServer(): Promise<McpServer> {
  try {
    // Get KS from environment (required for stdio mode)
    const ks = McpConfig.kaltura.defaultKs
    if (!ks) {
      throw new Error(
        'KALTURA_KS environment variable is required for stdio mode. ' +
        'Set it in .env file or provide it when starting the server.'
      )
    }

    // Create API client instances
    const publicApiClient = new PublicAPIClient()
    const epClient = new EpClient()

    // Create an MCP server with configuration
    const server = new McpServer({
      name: config.server.name,
      version: config.server.version,
    })

    // Register all tools with KS from environment
    registerEventTools(server, ks, publicApiClient, epClient)
    // Register all resources with KS from environment
    registerEventResources(server, ks, publicApiClient)

    // Create a transport for communication
    const transport = new StdioServerTransport()
    // Connect the server to the transport
    await server.connect(transport)

    console.error('MCP Server started in stdio mode (KS provided)')
    return server
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    throw error
  }
}
