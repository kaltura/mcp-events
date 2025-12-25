import { Injectable } from '@nestjs/common';
import { AppLogger } from '@kaltura/services-common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { config } from './config/config';
import { registerEventTools } from './tools/eventTools';
import { registerEventResources } from './resources/eventResources';
import { PublicAPIClient } from './api/publicApiClient';
import { EpClient } from './api/epClient';
import { Response } from 'express';

/**
 * MCP Service
 * Creates a new MCP server instance per SSE connection
 * Each connection has its own KS captured in closure
 */
@Injectable()
export class McpService {
  private readonly logger = new AppLogger(McpService.name);

  constructor(
    private readonly publicApiClient: PublicAPIClient,
    private readonly epClient: EpClient,
  ) {
    this.logger.log('MCP Service initialized (per-connection mode)');
  }

  /**
   * Connect MCP server with SSE transport
   * Creates a NEW MCP server instance for this specific connection
   * @param ks Kaltura Session for this connection
   * @param endpoint SSE endpoint path
   * @param response Express Response object
   */
  async connectWithSSE(ks: string, endpoint: string, response: Response): Promise<void> {
    try {
      // Create a NEW MCP server instance for this connection
      const mcpServer = new McpServer({
        name: config.server.name,
        version: config.server.version,
      });

      // Register tools with THIS server and THIS KS
      // KS is captured in closure - each tool handler will use this KS
      registerEventTools(mcpServer, ks, this.publicApiClient, this.epClient);

      // Register resources with THIS server and THIS KS
      registerEventResources(mcpServer, ks, this.publicApiClient);

      // Create SSE transport for this connection
      const transport = new SSEServerTransport(endpoint, response);

      // Connect this server instance to this transport
      await mcpServer.connect(transport);

      this.logger.log(`MCP Server connected via SSE (KS: ${ks.substring(0, 10)}...)`);
    } catch (error) {
      this.logger.error('Failed to connect MCP server with SSE:', error);
      throw error;
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    return true; // Service is always healthy (creates servers on demand)
  }
}
