import { ConsoleLogger, Injectable } from '@nestjs/common'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { config } from './config/config'
import { registerAllDomainTools, registerAllDomainResources } from './domains'
import { PublicApiClient } from './api/publicApiClient'
import { Request, Response } from 'express'

/**
 * MCP Service — stateless mode.
 * A fresh McpServer and transport are created for every incoming request.
 * The KS is read from the Authorization header on each request and captured
 * in the tool/resource closures for that request's lifetime only.
 */
@Injectable()
export class McpService {
  private readonly logger = new ConsoleLogger(McpService.name, { timestamp: true })

  constructor(private readonly publicApiClient: PublicApiClient) {
    this.logger.log('MCP Service initialized (stateless mode)')
  }

  async handleRequest(ks: string, request: Request, response: Response, scopes: string[]): Promise<void> {
    const mcpServer = new McpServer({
      name: config.server.name,
      version: config.server.version,
    })

    registerAllDomainTools(mcpServer, ks, this.publicApiClient, scopes)
    registerAllDomainResources(mcpServer, ks, this.publicApiClient, scopes)

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless — no session tracking
    })

    await mcpServer.connect(transport)

    const body: unknown = typeof request.body === 'string' ? JSON.parse(request.body) : request.body

    const method = (body as { method?: string })?.method
    const toolName = (body as { params?: { name?: string } })?.params?.name
    if (method === 'tools/call') {
      this.logger.log(`Tool call: ${toolName ?? 'unknown'}`)
    } else if (method) {
      this.logger.log(`MCP method: ${method}`)
    }

    await transport.handleRequest(request, response, body)
  }

  async healthCheck(): Promise<boolean> {
    return true
  }
}
