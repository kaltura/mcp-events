import { Controller, Sse, Res, MessageEvent } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { AppLogger } from '@kaltura/services-common';
import { McpService } from './mcp.service';

@Controller('mcp')
export class McpController {
  private readonly logger = new AppLogger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  /**
   * SSE endpoint for MCP connections
   * Clients connect to this endpoint to communicate with the MCP server
   */
  @Sse('events')
  async handleSseConnection(
    @Res() response: Response,
  ): Promise<Observable<MessageEvent>> {
    this.logger.log('New SSE connection established');

    try {
      // Connect MCP server with SSE transport
      await this.mcpService.connectWithSSE('/mcp/events', response);

      // Return an observable that keeps the connection alive
      return new Observable<MessageEvent>((subscriber) => {
        // Set up SSE headers
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        response.setHeader('Access-Control-Allow-Origin', '*');

        // Handle connection close
        response.on('close', () => {
          this.logger.log('SSE connection closed');
          subscriber.complete();
        });

        // Keep connection alive with periodic heartbeat
        const heartbeat = setInterval(() => {
          subscriber.next({ data: { type: 'heartbeat' } });
        }, 30000);

        // Clean up on unsubscribe
        return () => {
          clearInterval(heartbeat);
          this.logger.log('SSE connection cleaned up');
        };
      });
    } catch (error) {
      this.logger.error('Failed to establish SSE connection:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string }> {
    const isHealthy = await this.mcpService.healthCheck();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
    };
  }
}
