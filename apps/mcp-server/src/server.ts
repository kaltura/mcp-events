import { serveStdio, type StdioServerHandle } from '@modelcontextprotocol/server/stdio'
import { McpServer } from '@modelcontextprotocol/server'
import { config } from './config/config'
import { registerAllDomainTools, registerAllDomainResources } from './domains'
import { PublicApiClient } from './api/publicApiClient'
import { SCOPES } from './auth/scopes'

/**
 * Initialize and start the MCP server (stdio mode for local development)
 * Uses KALTURA_KS environment variable for authentication
 *
 * `serveStdio` owns the era decision for the connection (2025-legacy or
 * 2026-07-28-modern) and calls the factory below to build the one instance
 * pinned for the connection's lifetime — the same factory serves both eras.
 */
export function startServer(): StdioServerHandle {
  try {
    // Get KS from environment (required for stdio mode)
    const ks = config.kaltura.ks
    if (!ks) {
      throw new Error(
        'KALTURA_KS environment variable is required for stdio mode. ' +
          'Set it in .env file or provide it when starting the server.',
      )
    }

    // Create API client instance
    const publicApiClient = new PublicApiClient()

    const buildServer = (): McpServer => {
      // Create an MCP server with configuration
      const server = new McpServer({
        name: config.server.name,
        version: config.server.version,
      })

      // Register all tools with KS from environment — stdio mode is trusted, grant all scopes
      registerAllDomainTools(server, ks, publicApiClient, [...SCOPES])
      // Register all resources with KS from environment
      registerAllDomainResources(server, ks, publicApiClient, [...SCOPES])

      return server
    }

    const handle = serveStdio(buildServer, {
      onerror: (error) => console.error('MCP stdio transport error:', error),
    })

    console.error('MCP Server started in stdio mode (KS provided)')
    return handle
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    throw error
  }
}
