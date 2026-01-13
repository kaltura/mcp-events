import { Injectable } from '@nestjs/common'
import { AppLogger } from '@kaltura/services-common'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { config } from './config/config'
import { registerEventTools } from './tools/eventTools'
import { registerEventResources } from './resources/eventResources'
import { PublicAPIClient } from './api/publicApiClient'
import { randomUUID, UUID } from 'crypto'
import { ServerRequest } from '@modelcontextprotocol/sdk/types'
import { ServerResponse } from 'http'

type JsonRpcRequest = {
  jsonrpc: '2.0'
  method: string
  params?: { name?: string }
  id?: string | number | null
}

/**
 * MCP Service
 * Creates a new MCP server instance per connection (SSE or Streamable HTTP)
 * Each connection has its own KS captured in closure
 */
@Injectable()
export class McpService {
  private readonly logger = new AppLogger(McpService.name)

  // Store active SSE transports by sessionId for POST message routing
  private readonly sseTransports = new Map<string, SSEServerTransport>()

  // Store active Streamable HTTP transports by sessionId
  private readonly streamableTransports = new Map<string, StreamableHTTPServerTransport>()

  constructor(private readonly publicApiClient: PublicAPIClient) {
    this.logger.log('MCP Service initialized (per-connection mode)')
  }

  /**
   * Connect MCP server with SSE transport
   * Creates a NEW MCP server instance for this specific connection
   * @param ks Kaltura Session for this connection
   * @param endpoint SSE endpoint path
   * @param response Express Response object
   * @returns Promise that resolves when connection closes
   */
  async connectWithSSE(ks: string, endpoint: string, response: ServerResponse): Promise<void> {
    // Return a promise that only resolves when the connection closes
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Create a NEW MCP server instance for this connection
        const mcpServer = new McpServer({
          name: config.server.name,
          version: config.server.version,
        })

        // Register tools with THIS server and THIS KS
        // KS is captured in closure - each tool handler will use this KS
        registerEventTools(mcpServer, ks, this.publicApiClient)

        // Register resources with THIS server and THIS KS
        registerEventResources(mcpServer, ks, this.publicApiClient)

        // Create SSE transport for this connection
        const transport = new SSEServerTransport(endpoint, response)

        // Connect this server instance to this transport
        await mcpServer.connect(transport)

        // Store transport by sessionId for POST message routing
        const sessionId = transport.sessionId
        this.sseTransports.set(sessionId, transport)
        this.logger.log(`MCP Server connected via SSE (sessionId: ${sessionId})`)

        // Cleanup when connection closes and resolve the promise
        response.on('close', () => {
          this.sseTransports.delete(sessionId)
          this.logger.log(`SSE connection closed (sessionId: ${sessionId})`)
          resolve() // Connection closed, resolve the promise
        })

        // Handle errors
        response.on('error', (error: unknown) => {
          this.logger.error(`SSE connection error (sessionId: ${sessionId}):`, error)
          this.sseTransports.delete(sessionId)
          reject(error)
        })
      } catch (error) {
        this.logger.error('Failed to connect MCP server with SSE:', error)
        reject(error)
      }
    })
  }

  /**
   * Handle POST messages for SSE transport
   * Routes messages to the appropriate transport based on sessionId
   */
  async handlePostMessage(request: ServerRequest, response: Response): Promise<void> {
    try {
      // Extract sessionId from query parameters
      const sessionId = request.query.sessionId as string

      if (!sessionId) {
        this.logger.error('POST request missing sessionId')
        response.status(400).json({ error: 'Missing sessionId' })
        return
      }

      // Find the SSE transport for this session
      const transport = this.sseTransports.get(sessionId)

      if (!transport) {
        this.logger.error(`No active SSE transport found for sessionId: ${sessionId}`)
        response.status(404).json({ error: 'Session not found' })
        return
      }

      // Parse request body
      let body: unknown
      if (typeof request.body === 'string') {
        body = JSON.parse(request.body)
      } else {
        body = request.body
      }

      // Log the incoming request for monitoring
      const jsonRpcBody = body as JsonRpcRequest
      if (jsonRpcBody?.method === 'tools/call') {
        this.logger.log(
          `[${sessionId.substring(0, 8)}...] Tool call: ${jsonRpcBody.params?.name || 'unknown'}`,
        )
      } else if (jsonRpcBody?.method) {
        this.logger.log(`[${sessionId.substring(0, 8)}...] MCP method: ${jsonRpcBody.method}`)
      }

      // Forward message to the transport
      await transport.handlePostMessage(request, response, body)
    } catch (error) {
      this.logger.error('Error handling POST message:', error)
      response.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * Connect MCP server with Streamable HTTP transport
   * Handles session management: creates new server on first request, reuses on subsequent
   * @param ks Kaltura Session for this connection
   * @param request Express Request object
   * @param response Express Response object
   */
  async connectWithStreamableHttp(ks: string, request: Request, response: Response): Promise<void> {
    try {
      // Parse request body
      let body: unknown
      if (typeof request.body === 'string') {
        body = JSON.parse(request.body)
      } else {
        body = request.body
      }

      // Check if this is an existing session (has mcp-session-id header)
      const existingSessionId = request.headers['mcp-session-id'] as string

      if (existingSessionId) {
        // Reuse existing transport for this session
        const transport = this.streamableTransports.get(existingSessionId)

        if (!transport) {
          this.logger.error(`No transport found for sessionId: ${existingSessionId}`)
          response.status(404).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Session not found' },
            id: null,
          })
          return
        }

        // Log the request
        const jsonRpcBody = body as JsonRpcRequest
        if (jsonRpcBody?.method === 'tools/call') {
          this.logger.log(
            `[${existingSessionId.substring(0, 8)}...] Tool call: ${jsonRpcBody.params?.name || 'unknown'}`,
          )
        } else if (jsonRpcBody?.method) {
          this.logger.log(`[${existingSessionId.substring(0, 8)}...] MCP method: ${jsonRpcBody.method}`)
        }

        // Handle request with existing transport
        await transport.handleRequest(request, response, body)
        return
      }

      // No existing session - this is the first request (initialize)
      // Create a NEW MCP server instance for this session
      const mcpServer = new McpServer({
        name: config.server.name,
        version: config.server.version,
      })

      // Register tools with THIS server and THIS KS
      // KS is captured in closure - each tool handler will use this KS
      registerEventTools(mcpServer, ks, this.publicApiClient, this.epClient)

      // Register resources with THIS server and THIS KS
      registerEventResources(mcpServer, ks, this.publicApiClient)

      // Create Streamable HTTP transport for this session
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: (): UUID => randomUUID(),
        onsessioninitialized: (sessionId): void => {
          this.streamableTransports.set(sessionId, transport)
          this.logger.log(`MCP Server connected via Streamable HTTP (sessionId: ${sessionId})`)
        },
        onsessionclosed: (sessionId): void => {
          this.streamableTransports.delete(sessionId)
          this.logger.log(`Streamable HTTP connection closed (sessionId: ${sessionId})`)
        },
      })

      // Connect this server instance to this transport
      await mcpServer.connect(transport)

      // Log the initialize request
      const jsonRpcBody = body as JsonRpcRequest
      this.logger.log(`[Streamable] New session - method: ${jsonRpcBody?.method || 'unknown'}`)

      // Handle the first request (initialize)
      await transport.handleRequest(request, response, body)
    } catch (error) {
      this.logger.error('Failed to connect MCP server with Streamable HTTP:', error)
      throw error
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    return true // Service is always healthy (creates servers on demand)
  }
}
