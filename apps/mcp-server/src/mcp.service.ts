import { Injectable } from '@nestjs/common';
import { AppLogger } from '@kaltura/services-common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { config } from './config/config';
import { registerEventTools } from './tools/eventTools';
import { registerEventResources } from './resources/eventResources';
import { Response } from 'express';

@Injectable()
export class McpService {
  private readonly logger = new AppLogger(McpService.name);
  private mcpServer: McpServer | null = null;

  constructor() {
    this.initializeMcpServer();
  }

  /**
   * Initialize the MCP server with tools and resources
   */
  private initializeMcpServer(): void {
    try {
      // Create an MCP server with configuration
      this.mcpServer = new McpServer({
        name: config.server.name,
        version: config.server.version,
      });

      // Register all tools
      registerEventTools(this.mcpServer);
      // Register all resources
      registerEventResources(this.mcpServer);

      this.logger.log('MCP Server initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MCP server:', error);
      throw error;
    }
  }

  /**
   * Connect MCP server with SSE transport
   * This is called for each SSE connection
   */
  async connectWithSSE(endpoint: string, response: Response): Promise<void> {
    if (!this.mcpServer) {
      throw new Error('MCP Server not initialized');
    }

    try {
      // Create SSE transport for this connection
      const transport = new SSEServerTransport(endpoint, response);

      // Connect the server to the transport
      await this.mcpServer.connect(transport);

      this.logger.log('MCP Server connected via SSE');
    } catch (error) {
      this.logger.error('Failed to connect MCP server with SSE:', error);
      throw error;
    }
  }

  /**
   * Get the MCP server instance
   */
  getMcpServer(): McpServer | null {
    return this.mcpServer;
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    return this.mcpServer !== null;
  }
}
